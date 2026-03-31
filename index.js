const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const app = express();
app.use(express.json());

const SLOTS = [
  { avatarX: 223, avatarY: 226, textX: 510, textY: 185 },
  { avatarX: 223, avatarY: 395, textX: 510, textY: 354 },
  { avatarX: 223, avatarY: 565, textX: 510, textY: 524 },
  { avatarX: 223, avatarY: 736, textX: 510, textY: 695 },
  { avatarX: 223, avatarY: 907, textX: 510, textY: 866 },
];

const AVATAR_RADIUS = 58;

function formatNumber(n) {
  const num = parseInt(n) || 0;
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString("pt-BR");
}

// BDFD retorna "Nome - Valor" — extrai só o nome
function parseName(raw) {
  if (!raw) return "";
  const idx = raw.lastIndexOf(" - ");
  if (idx !== -1) return raw.substring(0, idx).trim();
  return raw.trim();
}

function drawRoundedAvatar(ctx, img, cx, cy, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  ctx.stroke();
}

async function tryLoadAvatar(userId) {
  if (!userId || userId === "0") return null;
  const urls = [
    `https://cdn.discordapp.com/avatars/${userId}/avatar.png?size=128`,
    `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`,
  ];
  for (const url of urls) {
    try { return await loadImage(url); } catch {}
  }
  return null;
}

// Rota: /lb/nome1/valor1/id1/nome2/valor2/id2/.../nome5/valor5/id5
app.get("/lb/:u1/:v1/:id1/:u2/:v2/:id2/:u3/:v3/:id3/:u4/:v4/:id4/:u5/:v5/:id5", async (req, res) => {
  try {
    const { u1,v1,id1, u2,v2,id2, u3,v3,id3, u4,v4,id4, u5,v5,id5 } = req.params;
    const users = [
      { name: parseName(decodeURIComponent(u1)), value: v1, id: id1 },
      { name: parseName(decodeURIComponent(u2)), value: v2, id: id2 },
      { name: parseName(decodeURIComponent(u3)), value: v3, id: id3 },
      { name: parseName(decodeURIComponent(u4)), value: v4, id: id4 },
      { name: parseName(decodeURIComponent(u5)), value: v5, id: id5 },
    ];

    const bg = await loadImage(path.join(__dirname, "bg.png"));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0);

    for (let i = 0; i < 5; i++) {
      const slot = SLOTS[i];
      const { name, value, id } = users[i];

      // Avatar
      const avatarImg = await tryLoadAvatar(id);
      if (avatarImg) {
        drawRoundedAvatar(ctx, avatarImg, slot.avatarX, slot.avatarY, AVATAR_RADIUS);
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.arc(slot.avatarX, slot.avatarY, AVATAR_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#444";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
        if (name) {
          ctx.font = `bold ${AVATAR_RADIUS}px sans-serif`;
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(name[0].toUpperCase(), slot.avatarX, slot.avatarY);
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
        }
      }

      // Nome
      ctx.font = "bold 42px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.95)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(name || "—", slot.textX, slot.textY + 42);

      // Saldo
      ctx.font = "bold 34px sans-serif";
      ctx.fillStyle = "#ffe066";
      ctx.shadowColor = "rgba(0,0,0,0.95)";
      ctx.shadowBlur = 6;
      ctx.fillText(`${formatNumber(value)} breu`, slot.textX, slot.textY + 90);

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    res.setHeader("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
