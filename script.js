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

function weeklyText(parashah) {
  if (!parashah) return 'No weekly portion found.';
  return parashah.hebrew || parashah.title || parashah.text || 'Weekly portion found.';
}

function dailyText(parashah, leyning) {
  const aliyot = parashah?.leyning && typeof parashah.leyning === 'object'
    ? Object.entries(parashah.leyning)
        .filter(([k]) => !['torah', 'haftarah', 'triennial'].includes(k))
        .map(([k, v]) => `${k}. ${v}`)
    : [];

  if (aliyot.length) return aliyot.join('\n');

  const items = leyning?.items || [];
  if (items.length) {
    return items.map((x, i) => `${i + 1}. ${x._text || x.title || x.hebrew || x.text || 'Aliyah'}`).join('\n');
  }

  return 'No aliyah data found for today.';
}

async function main() {
  try {
    const [weekly, leyning] = await Promise.all([getJson(shabbatUrl), getJson(leyningUrl)]);
    const parashah = getParashah(weekly);

    document.getElementById('weeklyStatus').textContent = weeklyText(parashah);
    document.getElementById('dailyStatus').textContent = dailyText(parashah, leyning);

    const output = {
      date: weekly.date || iso,
      parashah: parashah ? {
        title: parashah.title,
        hebrew: parashah.hebrew,
        category: parashah.category,
        leyning: parashah.leyning || null
      } : null,
      leyning
    };

    document.getElementById('details').textContent = JSON.stringify(output, null, 2);
  } catch (e) {
    document.getElementById('weeklyStatus').textContent = 'Error loading weekly portion.';
    document.getElementById('dailyStatus').textContent = 'Error loading daily aliyah.';
    document.getElementById('details').textContent = String(e);
  }
}

main();
