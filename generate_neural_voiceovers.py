import asyncio
import edge_tts
import os

VOICE = "en-IN-NeerjaNeural"
RATE = "-2%" # slightly slower for maximum clarity and understandability

narrations = {
    "scene_1_intro.mp3": "Welcome to UrjaMitra, a decentralized renewable energy and rural enterprise platform, engineered specifically for field mobility across remote Indian villages.",
    "scene_2_dashboard.mp3": "Screen one presents the Village Cluster Dashboard. Energy Mitras manage audits across remote tribal hamlets like Rampur and Bastar, operating one hundred percent offline with on-device SQLite storage and airplane mode resilience.",
    "scene_3_voice_audit.mp3": "Screen two demonstrates the Voice-First Energy Audit. Mitras conduct audits simply by speaking in Hindi and regional dialects without typing. UrjaMitra parses appliance wattages, daily kilowatt hours, and tracks costly diesel generator expenses.",
    "scene_4_feasibility.mp3": "Screen three highlights the Enterprise Feasibility Engine. It runs deterministic financial models for rural businesses such as tribal homestays and solar millet mills, calculating PM-KUSUM subsidies, net monthly profits, and payback periods.",
    "scene_5_recommendations.mp3": "Screen four delivers Clean Energy Recommendations. It automatically sizes rooftop solar PV arrays, forty-eight volt lithium iron phosphate batteries, and energy efficient appliances, completely eliminating diesel generators.",
    "scene_6_report_sync.mp3": "Screen five generates instant bilingual PDF audit reports for village Sarpanches. Field audits queue securely on-device and synchronize with the central SQLite supervisor database whenever connectivity is restored.",
    "scene_7_outro.mp3": "UrjaMitra bridges the energy divide, bringing reliable clean power, economic resilience, and decentralized sustainability to rural India."
}

async def generate():
    out_dir = os.path.join("public", "audio")
    os.makedirs(out_dir, exist_ok=True)
    for filename, text in narrations.items():
        out_path = os.path.join(out_dir, filename)
        print(f"Generating {filename} with voice {VOICE}...")
        communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
        await communicate.save(out_path)
        print(f"[OK] Saved {filename}")

if __name__ == "__main__":
    asyncio.run(generate())
