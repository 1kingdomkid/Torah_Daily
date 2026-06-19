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

function getParashah(data) {
  return (data.items || []).find(x => x.category === 'parashat' || x.category === 'parsha') || null;
}

function aliyahCards(parashah, leyning) {
  const out = [];

  if (parashah?.leyning && typeof parashah.leyning === 'object') {
    for (const [k, v] of Object.entries(parashah.leyning)) {
      if (['torah', 'haftarah', 'triennial'].includes(k)) continue;
      out.push({ key: k, value: v });
    }
    if (parashah.leyning.torah) out.unshift({ key: 'Torah', value: parashah.leyning.torah });
    if (parashah.leyning.haftarah) out.push({ key: 'Haftarah', value: parashah.leyning.haftarah });
  }

  if (!out.length && Array.isArray(leyning?.items)) {
    leyning.items.forEach((x, i) => out.push({
      key: String(i + 1),
      value: x._text || x.title || x.hebrew || x.text || 'Aliyah'
    }));
  }

  return out;
}

function renderAliyot(container, parashah, leyning) {
  const items = aliyahCards(parashah, leyning);
  if (!items.length) {
    container.textContent = 'No aliyah data found for today.';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="aliyah">
      <div class="aliyah-num">${item.key}</div>
      <div class="aliyah-text">${item.value}</div>
    </div>
  `).join('');
}

async function main() {
  try {
    const [weekly, leyning] = await Promise.all([getJson(shabbatUrl), getJson(leyningUrl)]);
    const parashah = getParashah(weekly);

    document.getElementById('weeklyStatus').textContent =
      parashah ? (parashah.hebrew || parashah.title || parashah.text || 'Weekly portion found.') : 'No weekly portion found.';

    renderAliyot(document.getElementById('dailyStatus'), parashah, leyning);

    document.getElementById('details').textContent = JSON.stringify({
      date: weekly.date || iso,
      parashah: parashah ? {
        title: parashah.title,
        hebrew: parashah.hebrew,
        category: parashah.category,
        leyning: parashah.leyning || null
      } : null,
      leyning
    }, null, 2);
  } catch (e) {
    document.getElementById('weeklyStatus').textContent = 'Error loading weekly portion.';
    document.getElementById('dailyStatus').textContent = 'Error loading daily aliyah.';
    document.getElementById('details').textContent = String(e);
  }
}

main();
