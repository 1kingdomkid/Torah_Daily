const today = new Date();
document.getElementById('todayDate').textContent =
  today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const isoDate = today.toISOString().slice(0, 10);
const hebcalWeeklyUrl = `https://www.hebcal.com/shabbat?cfg=json&gy=${today.getFullYear()}&gm=${today.getMonth()+1}&gd=${today.getDate()}&g2h=1`;
const hebcalLeyningUrl = `https://www.hebcal.com/leyning?cfg=json&date=${isoDate}&v=1`;

async function loadData() {
  try {
    const [weeklyRes, leyningRes] = await Promise.all([
      fetch(hebcalWeeklyUrl),
      fetch(hebcalLeyningUrl)
    ]);

    const weekly = await weeklyRes.json();
    const leyning = await leyningRes.json();

    const parsha = weekly?.items?.find(item => item.category === 'parashat');
    const weeklyText = parsha
      ? `Parashat ${parsha.hebrew || parsha.title || parsha.text || 'Unknown'}`
      : 'Weekly portion not found.';
    document.getElementById('weeklyStatus').textContent = weeklyText;

    const aliyot = leyning?.items || [];
    const dailyText = aliyot.length
      ? aliyot.map((item, i) => `${i + 1}. ${item?._text || item?.title || item?.hebrew || 'Aliyah'}`).join('\n')
      : 'No daily leyning data found for today.';
    document.getElementById('dailyStatus').textContent = dailyText;

    document.getElementById('details').textContent = JSON.stringify({
      weekly,
      leyning
    }, null, 2);
  } catch (err) {
    document.getElementById('weeklyStatus').textContent = 'Error loading weekly portion.';
    document.getElementById('dailyStatus').textContent = 'Error loading daily reading.';
    document.getElementById('details').textContent = String(err);
  }
}

loadData();
