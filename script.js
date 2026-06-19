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

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function showWeekly(data) {
  const item = (data.items || []).find(x => x.category === 'parashat' || x.category === 'parsha');
  if (!item) return 'No weekly portion found.';
  return item.hebrew || item.title || item.text || 'Weekly portion found, but no title available.';
}

function showDaily(data) {
  const items = data.items || [];
  if (!items.length) return 'No aliyah data found for today.';
  return items.map((x, i) => {
    const name = x._text || x.title || x.hebrew || x.text || 'Aliyah';
    return `${i + 1}. ${name}`;
  }).join('\n');
}

async function main() {
  try {
    const [weekly, leyning] = await Promise.all([
      getJson(shabbatUrl),
      getJson(leyningUrl)
    ]);

    document.getElementById('weeklyStatus').textContent = showWeekly(weekly);
    document.getElementById('dailyStatus').textContent = showDaily(leyning);
    document.getElementById('details').textContent = JSON.stringify({ weekly, leyning }, null, 2);
  } catch (e) {
    document.getElementById('weeklyStatus').textContent = 'Error loading weekly portion.';
    document.getElementById('dailyStatus').textContent = 'Error loading daily aliyah.';
    document.getElementById('details').textContent = String(e);
  }
}

main();
