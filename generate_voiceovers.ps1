Add-Type -AssemblyName System.Speech

$narrations = [ordered]@{
    "scene_1_intro.wav" = "Welcome to UrjaMitra, a decentralized renewable energy and rural enterprise platform, engineered specifically for field mobility across remote Indian villages."
    "scene_2_dashboard.wav" = "Screen one presents the Village Cluster Dashboard. Energy mitras manage audits across remote tribal hamlets like Rampur and Bastar, operating one hundred percent offline with on-device SQLite storage and airplane mode resilience."
    "scene_3_voice_audit.wav" = "Screen two demonstrates the Voice-First Energy Audit. Mitras conduct audits simply by speaking in Hindi and regional dialects without typing. UrjaMitra parses appliance wattages, daily kilowatt hours, and tracks costly diesel generator expenses."
    "scene_4_feasibility.wav" = "Screen three highlights the Enterprise Feasibility Engine. It runs deterministic financial models for rural businesses such as tribal homestays and solar millet mills, calculating PM-KUSUM subsidies, net monthly profits, and payback periods."
    "scene_5_recommendations.wav" = "Screen four delivers Clean Energy Recommendations. It automatically sizes rooftop solar PV arrays, forty-eight volt lithium iron phosphate batteries, and energy efficient appliances, completely eliminating diesel generators."
    "scene_6_report_sync.wav" = "Screen five generates instant bilingual PDF audit reports for village Sarpanches. Field audits queue securely on-device and synchronize with the central SQLite supervisor database whenever connectivity is restored."
    "scene_7_outro.wav" = "UrjaMitra bridges the energy divide, bringing reliable clean power, economic resilience, and decentralized sustainability to rural India."
}

foreach ($key in $narrations.Keys) {
    $outPath = Join-Path "public\audio" $key
    $text = $narrations[$key]
    Write-Host "Generating: $key..."
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.SelectVoice('Microsoft Zira Desktop')
    $synth.Rate = 0
    $synth.SetOutputToWaveFile($outPath)
    $synth.Speak($text)
    $synth.Dispose()
}

Write-Host "ALL VOICEOVERS GENERATED SUCCESSFULLY!"
