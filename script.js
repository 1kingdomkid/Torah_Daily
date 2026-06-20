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

function normalizeBook(book) {
  // Normalize "I Samuel" -> "1Samuel", "Numbers" -> "Numbers", etc.
  return book
    .replace(/\s+/g, '')              // remove spaces
    .replace(/I /g, '1')              // I Samuel -> 1Samuel
    .replace(/II /g, '2')             // II Samuel -> 2Samuel
    .replace(/III /g, '3');           // III Samuel -> 3Samuel (if needed)
}

function toSefariaRef(value) {
  // value like "Numbers 16:1-16:13" or "I Samuel 11:14-12:22"
  const [book, rest] = value.split(' ');
  const normalizedBook = normalizeBook(book);
  const sections = rest.replace(/:/g, '.').replace(/-/g, '-'); // "16:1-16:13" -> "16.1-16.13"
  return `${normalizedBook}.${sections}`;
}

function bibleGatewayUrl(value, version = 'ESV') {
  // value like "Numbers 16:1-16:13"
  const passage = value.replace(/ /g, '+');
  return `https://www.biblegateway.com/bible?passage=${passage}&version=${version}&language=en`;
}

function sefariaUrl(value) {
  const ref = toSefariaRef(value);
  return `https://www.sefaria.org/${ref}`;
}

function renderAliyot(container, parashah, leyning) {
  const items = aliyahCards(parashah, leyning);
  if (!items.length) {
    container.textContent = 'No aliyah data found for today.';
    return;
  }

  container.innerHTML = items.map(item => {
    const bgLink = bibleGatewayUrl(item.value);
    const sfLink = sefariaUrl(item.value);
    return `
      <div class="aliyah">
        <div class="aliyah-num">${item.key}</div>
        <div class="aliyah-text">${item.value}</div>
        <div class="aliyah-links">
          <a class="link bg" href="${bgLink}" target="_blank" rel="noopener">BibleGateway</a>
          <a class="link sf" href="${sfLink}" target="_blank" rel="noopener">Sefaria</a>
        </div>
      </div>
    `;
  }).join('');
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
