from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai

genai.configure(api_key="AIzaSyCHO7JPBl4sMTW9nV8SL4UfNRBSpRgV-Es")

model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

class Prompt(BaseModel):
    prompt: str

@app.post("/prompt")
async def gerar_resposta(data: Prompt):
    response = model.generate_content(data.prompt)
    return {"resposta": response.text}

