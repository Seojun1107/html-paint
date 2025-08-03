const socket = io();
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let drawing = false;
let erasing = false;
let strokeColor = '#000000';
let strokeWidth = 3;

let nickname = prompt('닉네임을 입력해주세요');
if (!nickname || nickname.trim() === '') nickname = '익명';

socket.emit('join', nickname);

const cursorMap = new Map();

ctx.lineCap = 'round';

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function startDrawing(x, y) {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(x, y);
  socket.emit('draw', {
    type: 'begin', x, y,
    color: erasing ? '#ffffff' : strokeColor,
    lineWidth: strokeWidth
  });
}

function continueDrawing(x, y) {
  if (!drawing) return;
  ctx.lineTo(x, y);
  ctx.stroke();
  socket.emit('draw', {
    type: 'draw', x, y,
    color: erasing ? '#ffffff' : strokeColor,
    lineWidth: strokeWidth
  });
}

function stopDrawing() {
  drawing = false;
}

function showNotice(message) {
  const box = document.getElementById('notice-box');
  box.textContent = message;
  box.style.opacity = 1;
  setTimeout(() => {
    box.style.opacity = 0;
  }, 3000);
}

// 마우스
canvas.addEventListener('mousedown', e => {
  ctx.strokeStyle = erasing ? '#ffffff' : strokeColor;
  ctx.lineWidth = strokeWidth;
  startDrawing(e.clientX, e.clientY);
});

canvas.addEventListener('mousemove', e => {
  if (drawing) continueDrawing(e.clientX, e.clientY);
  socket.emit('cursor', { x: e.clientX, y: e.clientY, color: strokeColor });
});

canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// 터치
canvas.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  ctx.strokeStyle = erasing ? '#ffffff' : strokeColor;
  ctx.lineWidth = strokeWidth;
  startDrawing(touch.clientX, touch.clientY);
});

canvas.addEventListener('touchmove', e => {
  const touch = e.touches[0];
  continueDrawing(touch.clientX, touch.clientY);
  socket.emit('cursor', { x: touch.clientX, y: touch.clientY, color: strokeColor });
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

socket.on('notice', (msg) => {
  showNotice(msg);
});

// 그리기 수신
socket.on('draw', ({ type, x, y, color, lineWidth }) => {
  ctx.strokeStyle = color || '#000000';
  ctx.lineWidth = lineWidth || 3;
  if (type === 'begin') {
    ctx.beginPath();
    ctx.moveTo(x, y);
  } else {
    ctx.lineTo(x, y);
    ctx.stroke();
  }
});

socket.on('clear', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('btn-clear').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit('clear');
});

document.getElementById('btn-eraser').addEventListener('click', () => {
  erasing = !erasing;
  document.getElementById('btn-eraser').textContent = erasing ? '펜' : '지우개';
});

// 색상 선택
document.querySelectorAll('.color-option').forEach(el => {
  el.addEventListener('click', () => {
    strokeColor = el.getAttribute('data-color');
  });
});

// 선 굵기 조절
document.getElementById('line-width').addEventListener('input', (e) => {
  strokeWidth = parseInt(e.target.value);
});

// 실시간 커서 표시
socket.on('cursor', ({ id, x, y, color }) => {
  let indicator = cursorMap.get(id);
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'cursor-indicator';
    document.body.appendChild(indicator);
    cursorMap.set(id, indicator);
  }
  indicator.style.left = `${x}px`;
  indicator.style.top = `${y}px`;
  indicator.style.background = color || '#000';
});

socket.on('cursor-remove', (id) => {
  const indicator = cursorMap.get(id);
  if (indicator) {
    indicator.remove();
    cursorMap.delete(id);
  }
});
