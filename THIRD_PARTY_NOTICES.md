# Third-party notices

ReadyBy's original source is licensed under MIT. Third-party components retain their own copyright, license and terms. Installed dependency distributions contain their applicable license texts; the lockfile identifies exact JavaScript versions.

| Component | Use | License |
| --- | --- | --- |
| Google Gen AI SDK | Gemini Live audio and ephemeral credentials | Apache-2.0 |
| Model Context Protocol TypeScript SDK | Real MCP client/server and Streamable HTTP | MIT |
| React and React DOM | Household web interface | MIT |
| Zod | Typed protocol validation | MIT |
| Lucide | Interface icons | ISC |
| Vosk | Optional speech recognition, separately installed | Apache-2.0 |
| Vosk small English model | Optional downloaded recognition weights | Publisher's Apache-2.0 terms; archive checksum verified by setup |

Optional speech dependencies are pinned in `scripts/speech-requirements.txt`; their distributions carry their individual licenses. Ollama and downloaded language-model weights are not bundled; check their own terms and hardware requirements. Groq, Gemini and NVIDIA hosted services are subject to provider terms, quota and billing. Browser-installed speech voices are not distributed with ReadyBy.

ReadyBy is not affiliated with or endorsed by Amazon. Alexa, Echo and other third-party names identify the intended ecosystem or referenced services. The separate IntentSeal project is not a runtime dependency. No Abide source or artwork is incorporated; its repository presentation was a requested structural reference.
