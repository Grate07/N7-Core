const { createCanvas, loadImage } = require('@napi-rs/canvas');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function fetchAvatarBuffer(url) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates a RUNO-style rank card: circular avatar with a yellow ring,
 * username, rank badge, level, and an XP progress bar — purple/Aster MC themed.
 * Returns a PNG Buffer ready to attach to a message.
 */
async function generateRankCard({ username, avatarURL, level, rank, currentXp, neededXp, totalXp, themeColor }) {
  const width = 934;
  const height = 282;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#150019');
  bg.addColorStop(1, '#2c0b40');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, width, height, 24);
  ctx.fill();

  // Left accent stripe
  ctx.fillStyle = themeColor;
  ctx.fillRect(0, 0, 10, height);

  // Avatar
  const avatarSize = 180;
  const avatarX = 56;
  const avatarY = (height - avatarSize) / 2;

  try {
    const avatarBuffer = await fetchAvatarBuffer(avatarURL);
    const avatarImg = await loadImage(avatarBuffer);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  } catch (err) {
    // Fall back to a plain circle if the avatar fails to load.
    ctx.fillStyle = '#3a1450';
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Yellow ring around avatar
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#FFD700';
  ctx.stroke();

  const textX = avatarX + avatarSize + 40;

  // Username
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(username, textX, 95);

  // Level
  ctx.fillStyle = '#c9b8db';
  ctx.font = '28px sans-serif';
  ctx.fillText(`LEVEL ${level}`, textX, 135);

  // Rank badge, top right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#b9a3d1';
  ctx.font = '22px sans-serif';
  ctx.fillText('RANK', width - 50, 58);
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText(`#${rank}`, width - 50, 102);

  // XP progress bar
  const barX = textX;
  const barY = 175;
  const barWidth = width - barX - 56;
  const barHeight = 28;

  ctx.fillStyle = '#3a1450';
  roundRect(ctx, barX, barY, barWidth, barHeight, 14);
  ctx.fill();

  const progress = neededXp > 0 ? Math.min(currentXp / neededXp, 1) : 0;
  if (progress > 0) {
    const fillGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    fillGradient.addColorStop(0, '#8a2be2');
    fillGradient.addColorStop(1, '#c77dff');
    ctx.fillStyle = fillGradient;
    roundRect(ctx, barX, barY, Math.max(barWidth * progress, barHeight), barHeight, 14);
    ctx.fill();
  }

  // XP text below the bar
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px sans-serif';
  ctx.fillText(`${currentXp} / ${neededXp} XP`, barX, barY + 55);

  ctx.textAlign = 'right';
  ctx.fillText(`Total: ${totalXp} XP`, barX + barWidth, barY + 55);

  return canvas.toBuffer('image/png');
}

module.exports = { generateRankCard };
