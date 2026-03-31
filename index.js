const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const app = express();
app.use(express.json());

// Posições de cada slot baseadas na imagem 1075x992
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

// GET /leaderboard?u1=nome&v1=saldo&a1=avatarURL&u2=...&v2=...&a2=...
app.get("/leaderboard", async (req, res) => {
  try {
    const bg = await loadImage(path.join(__dirname, "bg.png"));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0);

    for (let i = 1; i <= 5; i++) {
      const slot = SLOTS[i - 1];
      const username = req.query[`u${i}`] || "";
      const value = req.query[`v${i}`] || "0";
      const avatarUrl = req.query[`a${i}`] || "";

      // Avatar
      if (avatarUrl) {
        try {
          const avatarImg = await loadImage(avatarUrl + "?size=128");
          drawRoundedAvatar(ctx, avatarImg, slot.avatarX, slot.avatarY, AVATAR_RADIUS);
        } catch {
          ctx.save();
          ctx.beginPath();
          ctx.arc(slot.avatarX, slot.avatarY, AVATAR_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = "#666";
          ctx.fill();
          ctx.restore();
        }
      }

      // Nome
      ctx.font = "bold 42px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.95)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(username, slot.textX, slot.textY + 42);

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
