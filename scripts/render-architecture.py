"""Export the actual ReadyBy architecture as an editable SVG and matching PNG."""
from pathlib import Path
from html import escape
import math
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'architecture'
OUT.mkdir(parents=True, exist_ok=True)
W, H, SCALE = 1620, 1030, 2
BG, INK, MUTED = '#fafaf8', '#17263f', '#526073'
NAVY, ORANGE, LINE = '#203f67', '#dd5917', '#576373'
image = Image.new('RGB', (W*SCALE, H*SCALE), BG)
draw = ImageDraw.Draw(image)
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">',
       '<title id="title">ReadyBy actual system architecture</title>',
       '<desc id="desc">Household input passes through authenticated endpoints, local language interpretation and validation. A deterministic scheduler and independent checker produce proposals. Changes to commitments need household approval. SQLite persists actions and receipts. Ollama and optional Vosk run locally. MCP 2025-11-25 tools are implemented over Streamable HTTP. Hosted providers use server-side keys; local Ollama is an alternative.</desc>',
       f'<rect width="{W}" height="{H}" fill="{BG}"/>']

def font(size=20, bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf', size*SCALE)

def text(x, y, value, size=20, color=INK, bold=False, anchor='start'):
    svg.append(f'<text x="{x}" y="{y}" font-family="Segoe UI,Arial,sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}" text-anchor="{anchor}">{escape(value)}</text>')
    f=font(size,bold)
    width=draw.textlength(value,font=f)
    dx=x*SCALE-(width/2 if anchor=='middle' else width if anchor=='end' else 0)
    draw.text((dx,y*SCALE),value,font=f,fill=color,anchor='ls')

def rect(x,y,w,h,fill='#ffffff',stroke='#8793a5',radius=10,width=1.5,dashed=False):
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"'+(' stroke-dasharray="7 6"' if dashed else '')+'/>')
    draw.rounded_rectangle((x*SCALE,y*SCALE,(x+w)*SCALE,(y+h)*SCALE),radius=radius*SCALE,fill=fill,outline=stroke,width=round(width*SCALE))
    if dashed:
        # Matching dashed straight edges, with quiet rounded corners.
        draw.rounded_rectangle((x*SCALE,y*SCALE,(x+w)*SCALE,(y+h)*SCALE),radius=radius*SCALE,outline=fill,width=round(width*SCALE))
        for a in range(int(x+radius),int(x+w-radius),13):
            for b in [y,y+h]: draw.line((a*SCALE,b*SCALE,min(a+7,x+w-radius)*SCALE,b*SCALE),fill=stroke,width=round(width*SCALE))
        for a in range(int(y+radius),int(y+h-radius),13):
            for b in [x,x+w]: draw.line((b*SCALE,a*SCALE,b*SCALE,min(a+7,y+h-radius)*SCALE),fill=stroke,width=round(width*SCALE))

def arrow(points, color=LINE, dashed=False, width=1.7):
    coords=' '.join(f'{x},{y}' for x,y in points)
    svg.append(f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="{width}"'+(' stroke-dasharray="7 5"' if dashed else '')+'/>')
    scaled=[(x*SCALE,y*SCALE) for x,y in points]
    if dashed:
        for (x1,y1),(x2,y2) in zip(scaled,scaled[1:]):
            length=math.hypot(x2-x1,y2-y1)
            for offset in range(0,int(length),12*SCALE):
                end=min(offset+7*SCALE,length)
                draw.line((x1+(x2-x1)*offset/length,y1+(y2-y1)*offset/length,x1+(x2-x1)*end/length,y1+(y2-y1)*end/length),fill=color,width=round(width*SCALE))
    else: draw.line(scaled,fill=color,width=round(width*SCALE),joint='curve')
    x,y=points[-1]; px,py=points[-2]; angle=math.atan2(y-py,x-px)
    head=[(x,y),(x-11*math.cos(angle)+5*math.sin(angle),y-11*math.sin(angle)-5*math.cos(angle)),(x-11*math.cos(angle)-5*math.sin(angle),y-11*math.sin(angle)+5*math.cos(angle))]
    svg.append(f'<polygon points="'+ ' '.join(f'{a},{b}' for a,b in head)+f'" fill="{color}"/>')
    draw.polygon([(a*SCALE,b*SCALE) for a,b in head],fill=color)

def node(x,y,w,h,title,lines=(),active=False):
    rect(x,y,w,h,NAVY if active else '#ffffff',ORANGE if active else '#8793a5',width=2 if active else 1.4)
    top=y+32 if len(lines)<3 else y+27
    text(x+w/2,top,title,20,'#ffffff' if active else INK,True,'middle')
    for i,line in enumerate(lines): text(x+w/2,top+25+i*22,line,17,'#e3edf7' if active else MUTED,anchor='middle')

text(40,46,'ReadyBy in context',31,bold=True)
text(40,77,'Actual implementation • MCP connects household tools; AI interprets requests; checked schedules and consent govern changes.',20,MUTED)

rect(40,150,270,590)
text(58,177,'HOUSEHOLD INTERFACE',17,MUTED,True)
rect(355,150,920,590,'#edf2f8',NAVY,width=2)
text(375,177,'READYBY APPLICATION  /  NODE.JS',17,NAVY,True)
rect(1320,150,260,590,'#fafaf8','#98a6b8',dashed=True)
text(1338,177,'RUNTIMES / STORAGE',17,MUTED,True)

# Orthogonal data paths are drawn before nodes.
arrow([(175,315),(175,365)])
arrow([(290,398),(330,398),(330,238),(385,238)])
arrow([(508,265),(508,335)])
arrow([(385,410),(345,410),(345,440),(290,440)])
arrow([(935,388),(1000,388)])
arrow([(1110,440),(1110,580)])
arrow([(1000,630),(935,630)])
arrow([(810,680),(810,718),(330,718),(330,655),(290,655)])
arrow([(290,612),(385,612)])
arrow([(630,605),(655,605),(655,545),(1450,545),(1450,570)])
arrow([(508,335),(508,298),(1300,298),(1300,240),(1340,240)],NAVY)
arrow([(1560,300),(1600,300),(1600,510),(655,510),(655,465),(508,465),(508,440)],NAVY)
arrow([(290,420),(330,420),(330,480),(810,480),(810,440)],LINE,dashed=True)
arrow([(290,270),(320,270),(320,122),(1602,122),(1602,435),(1560,435)],'#8994a2',dashed=True)

node(60,215,230,100,'Household request',['Text or optional voice','Explicit progress reports'])
node(60,365,230,85,'React / MCP client',['Initialize • discover tools','Call the prepared action'])
node(60,580,230,100,'Review and approve',['Trade-off stays a proposal','Household confirms change'])
node(385,205,860,60,'Authenticated MCP endpoint /mcp',['2025-11-25 • Streamable HTTP • household session • CSRF • revisions • idempotency'])
node(385,335,245,105,'Interpret request',['Actual AI or scoped follow-up','Prepared tool call • 90s'],True)
node(690,335,245,105,'Execute selected tool',['Second tools/call request','Scoped, validated arguments'],True)
node(1000,335,245,105,'Schedule search',['Deterministic • bounded','Dependencies • capacity','Passive waits • deadline'],True)
node(1000,580,245,100,'Independent checker',['Deterministic validation','Preserve reported progress'],True)
node(690,580,245,100,'Recovery proposal',['Deferral / reassignment','Or admit a later departure'],True)
node(385,580,245,100,'Commit valid action',['Single-use review confirmation','Exact revision • receipt'],True)
node(1340,205,220,135,'Model providers',['Groq • Gemini fallback','Server-side keys only','Local Ollama mode available'])
node(1340,380,220,110,'Optional Vosk',['Local backend speech','PCM16 → transcript','Not an LLM'])

# SQLite record uses the same cylinder convention as the supplied reference.
x,y,w,h=1340,570,220,110
svg.append(f'<path d="M{x},{y+15} C{x},{y-5} {x+w},{y-5} {x+w},{y+15} V{y+h-15} C{x+w},{y+h+5} {x},{y+h+5} {x},{y+h-15} Z" fill="#f1f2f4" stroke="{LINE}" stroke-width="1.5"/>')
svg.append(f'<ellipse cx="{x+w/2}" cy="{y+15}" rx="{w/2}" ry="15" fill="#f1f2f4" stroke="{LINE}" stroke-width="1.5"/>')
draw.rectangle((x*SCALE,(y+15)*SCALE,(x+w)*SCALE,(y+h-15)*SCALE),fill='#f1f2f4',outline=LINE,width=3)
draw.ellipse((x*SCALE,(y+h-30)*SCALE,(x+w)*SCALE,(y+h)*SCALE),fill='#f1f2f4',outline=LINE,width=3)
draw.rectangle(((x+2)*SCALE,(y+20)*SCALE,(x+w-2)*SCALE,(y+h-15)*SCALE),fill='#f1f2f4')
draw.ellipse((x*SCALE,y*SCALE,(x+w)*SCALE,(y+30)*SCALE),fill='#f1f2f4',outline=LINE,width=3)
text(1450,621,'SQLite storage',20,bold=True,anchor='middle')
text(1450,648,'Missions • history • receipts',16,MUTED,anchor='middle')

text(800,111,'Optional speech API: local PCM16 in / editable transcript back',16,MUTED,anchor='middle')
text(902,287,'Hosted API (or selected local Ollama) • request + context',16,NAVY,anchor='middle')
text(338,455,'Call',14,MUTED,anchor='middle')
text(850,531,'LLM → structured intent only',16,NAVY,anchor='middle')
text(540,497,'Second tool call / direct task control',16,MUTED,anchor='middle')
text(850,565,'Transaction + receipts',16,MUTED,anchor='middle')
text(337,600,'Consent',15,MUTED,anchor='middle')
text(550,706,'Review exact proposal before changing commitments',16,MUTED,anchor='middle')

text(40,792,'WHAT THE HOUSEHOLD SEES',17,MUTED,True)
text(40,824,'Grounded reply • next actions • checked timeline • saved progress • actual system receipts',22)
text(40,856,'Passing time never completes a physical chore. Generated plans use estimates, not appliance telemetry.',19,MUTED)
rect(40,887,1540,83,'#fff7ef','#d7a47f',dashed=True)
text(60,916,'VERIFIED MCP IMPLEMENTATION — 13 TOOLS',17,'#98491e',True)
text(60,946,'Independent SDK client • protocol 2025-11-25 • Streamable HTTP • the same checked household state.',21)
text(40,1002,'Localhost Alexa+ simulator with real MCP. Hosted AI sends request + mission context. No native Alexa, AWS or IntentSeal integration.',18,MUTED)

svg.append('</svg>')
(OUT/'readyby-actual-architecture.svg').write_text('\n'.join(svg),encoding='utf-8')
image.save(OUT/'readyby-actual-architecture.png',optimize=True)
print(OUT/'readyby-actual-architecture.svg')
print(OUT/'readyby-actual-architecture.png')
