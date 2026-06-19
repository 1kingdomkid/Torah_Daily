const today = new Date();

document.getElementById('todayDate').textContent =
  today.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

const isoDate = today.toISOString().slice(0, 10);

const shabbatUrl = `https://www.hebcal.com/shabbat?cfg=json&geonameid=YY&date=${isoDate}`;
const leyningUrl = `https://www.hebcal.com/leyning?cfg=json&date=${isoDate}&v=1`;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatParsha(item) {
  if (!item) return 'Weekly portion not found.';
  const text = item.hebrew || item.title || item.text || 'Unknown';
  return `Parashat ${text}`;
}

function formatAliyot(data) {
  const items = data?.items || [];
  if (!items.length) return 'No daily reading found for today.';
  return items.map((item, i) => {
    const title = item._text || item.title || item.hebrew || item.text || 'Aliyah';
    return `${i + 1}. ${title}`;
  }).join('\n');
}

async function loadData() {
  try {
    const weekly = await fetchJson(shabbatUrl);
    const leyning = await fetchJson(leyningUrl);

    const parsha = (weekly.items || []).find(item => item.category === 'parashat' || item.category === 'parsha');
    document.getElementById('weeklyStatus').textContent = formatParsha(parsha);

    document.getElementById('dailyStatus').textContent = formatAliyot(leyning);

    document.getElementById('details').textContent = JSON.stringify({
      shabbat: weekly,
      leyning
    }, null, 2);
  } catch (err) {
    document.getElementById('weeklyStatus').textContent = 'Error loading weekly portion.';
    document.getElementById('dailyStatus').textContent = 'Error loading daily reading.';
    document.getElementById('details').textContent = String(err);
  }
}

loadData();
