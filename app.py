
import os
import json
import time
import urllib.request
import urllib.error

from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

# =====================================
# FOYDALI.UZ - AI SERVER
# =====================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = Flask(__name__)

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()

API_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/"
    f"models/{MODEL}:generateContent"
)

# =====================================
# SAYT SAHIFALARI
# =====================================

@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/style.css")
def style():
    return send_from_directory(BASE_DIR, "style.css")


@app.route("/script.js")
def script():
    return send_from_directory(BASE_DIR, "script.js")


# =====================================
# SERVER TEKSHIRUVI
# =====================================

@app.route("/health")
def health():
    return jsonify({
        "status": "online",
        "ai": "Google Gemini",
        "key_found": bool(API_KEY),
        "model": MODEL
    })


# =====================================
# SUHBAT TARIXINI TAYYORLASH
# =====================================

def prepare_history(history, message):

    contents = []

    if isinstance(history, list):

        for item in history[-8:]:

            if not isinstance(item, dict):
                continue

            role = item.get("role", "user")
            content = item.get("content") or item.get("text") or ""

            if role == "system" or not content:
                continue

            api_role = (
                "model"
                if role in ("assistant", "model")
                else "user"
            )

            content = str(content).strip()

            if not content:
                continue

            # Ketma-ket bir xil rollarni birlashtirish
            if contents and contents[-1]["role"] == api_role:
                contents[-1]["parts"][0]["text"] += "\n" + content
            else:
                contents.append({
                    "role": api_role,
                    "parts": [{"text": content}]
                })

    message = str(message).strip()

    if message:

        if not contents or (
            contents[-1]["role"] != "user"
            or contents[-1]["parts"][0]["text"] != message
        ):
            if contents and contents[-1]["role"] == "user":
                contents[-1]["parts"][0]["text"] += "\n" + message
            else:
                contents.append({
                    "role": "user",
                    "parts": [{"text": message}]
                })

    # Gemini suhbat user xabaridan boshlanishi kerak
    while contents and contents[0]["role"] != "user":
        contents.pop(0)

    return contents


# =====================================
# GEMINI AI CHAT
# =====================================

@app.route("/api/chat", methods=["POST"])
def chat():

    if not API_KEY:
        return jsonify({
            "error": "API kaliti topilmadi. .env faylini tekshiring."
        }), 500

    data = request.get_json(silent=True) or {}

    message = (
        data.get("message")
        or data.get("prompt")
        or data.get("text")
        or ""
    )

    history = data.get("messages", [])

    contents = prepare_history(history, message)

    if not contents or contents[-1]["role"] != "user":
        return jsonify({
            "error": "Iltimos, xabar yozing."
        }), 400

    # Tezroq javob uchun LOW thinking
    payload = {
        "contents": contents,
        "generationConfig": {
            "thinkingConfig": {
                "thinkingLevel": "LOW"
            },
            "maxOutputTokens": 1024
        }
    }

    body = json.dumps(payload).encode("utf-8")

    # =================================
    # API SO'ROVI
    # =================================

    for attempt in range(3):

        req = urllib.request.Request(
            API_URL,
            data=body,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": API_KEY
            },
            method="POST"
        )

        try:

            print(f"AI so'rovi: {attempt + 1}/3")

            with urllib.request.urlopen(
                req,
                timeout=60
            ) as response:

                result = json.loads(
                    response.read().decode("utf-8")
                )

            candidates = result.get("candidates", [])

            if not candidates:

                print("Gemini javobi:", result)

                return jsonify({
                    "error": "AI javob qaytarmadi. Qayta urinib ko'ring."
                }), 502

            candidate = candidates[0]

            parts = candidate.get(
                "content", {}
            ).get("parts", [])

            answer = "\n".join(
                part.get("text", "")
                for part in parts
                if part.get("text")
            ).strip()

            if not answer:

                return jsonify({
                    "error": "AI javobi bo'sh qaytdi."
                }), 502

            print("AI javobi tayyor!")

            return jsonify({
                "success": True,
                "reply": answer,
                "response": answer,
                "text": answer
            })

        except urllib.error.HTTPError as e:

            error_text = e.read().decode(
                "utf-8",
                errors="replace"
            )

            print("GEMINI XATOSI:", e.code)
            print(error_text)

            if e.code in (429, 500, 502, 503, 504):

                if attempt < 2:
                    time.sleep(attempt + 1)
                    continue

            return jsonify({
                "error": (
                    f"Gemini API xatoligi: {e.code}. "
                    "Birozdan keyin qayta urinib ko'ring."
                )
            }), e.code

        except TimeoutError:

            print("AI javobi kechikdi.")

            if attempt < 2:
                time.sleep(attempt + 1)
                continue

            return jsonify({
                "error": "AI javobi kechikdi. Qayta urinib ko'ring."
            }), 504

        except Exception as e:

            print("SERVER XATOSI:", str(e))

            return jsonify({
                "error": "Server xatosi: " + str(e)
            }), 500

    return jsonify({
        "error": "Gemini hozir band. Keyinroq urinib ko'ring."
    }), 503


# =====================================
# SERVERNI ISHGA TUSHIRISH
# =====================================

if __name__ == "__main__":

    print("=" * 45)
    print("       FOYDALI.UZ AI")
    print("=" * 45)

    print("API kaliti:", bool(API_KEY))
    print("AI modeli:", MODEL)
    print("Thinking: LOW")
    print("Server: http://127.0.0.1:5001")

    print("=" * 45)

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=False,
        threaded=True
    )
