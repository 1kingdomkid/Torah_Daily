const today = new Date();
const iso = today.toISOString().slice(0, 10);

document.getElementById('todayDate').textContent =
  today.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

const shabbatUrl = `https://www.hebcal.com/shabbat?cfg=json&date=${iso}`;
const leyningUrl = `https://www.hebcal.com/leyning?cfg=json&date=${iso}&v=1`;

function daysUntil(target) {
  const ms = new Date(target).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.max(0, Math.round(ms / 86400000));
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function weeklyText(data) {
  const item = (data.items || []).find(x => x.category === 'parashat' || x.category === 'parsha');
  return item ? (item.hebrew || item.title || item.text || 'Weekly portion found.') : 'No weekly portion found.';
}

function dailyText(data) {
  const items = data.items || [];
  if (!items.length) return 'No aliyah data found for today.';
  return items.map((x, i) => `${i + 1}. ${x._text || x.title || x.hebrew || x.text || 'Aliyah'}`).join('\n');
}

async function main() {
  try {
    const [weekly, leyning] = await Promise.all([getJson(shabbatUrl), getJson(leyningUrl)]);

    const nextShabbat = (weekly.items || []).find(x => x.category === 'parashat' || x.category === 'parsha');
    document.getElementById('weeklyStatus').textContent = weeklyText(weekly);
    document.getElementById('dailyStatus').textContent = dailyText(leyning);

    const summary = {
      weekly,
      leyning
    };

    document.getElementById('details').textContent = JSON.stringify(summary, null, 2);

    const shabbatTitle = nextShabbat ? (nextShabbat.hebrew || nextShabbat.title || nextShabbat.text || '') : '';
    const titleLine = shabbatTitle ? `Next portion: ${shabbatTitle}` : 'Next portion not found';
    const dateLine = weekly?.date ? `Hebcal date: ${weekly.date}` : '';
    document.title = `Torah Daily - ${titleLine}`;
    const extra = document.createElement('p');
    extra.style.marginTop = '12px';
    extra.style.color = '#94a3b8';
    extra.textContent = dateLine;
    document.querySelector('.hero').appendChild(extra);

    const shabbat = weekly?.date || null;
    if (shabbat) {
      const count = daysUntil(shabbat);
      const countEl = document.createElement('p');
      countEl.style.marginTop = '8px';
      countEl.style.color = '#f59e0b';
      countEl.textContent = count === 0 ? 'Shabbat is today.' : `${count} day(s) until the current Hebcal date.`;
      document.querySelector('.hero').appendChild(countEl);
    }
  } catch (e) {
    document.getElementById('weeklyStatus').textContent = 'Error loading weekly portion.';
    document.getElementById('dailyStatus').textContent = 'Error loading daily aliyah.';
    document.getElementById('details').textContent = String(e);
  }
}

main();
