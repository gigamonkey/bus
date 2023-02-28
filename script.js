const token = '3F7F44FFEDE5D6A98FB4443BF380514F';

const leaveFrom = '51583'; // University & California
const arriveAt = '51105'; // University & 6th

const millisToStop = 10 * 60 * 1000;

const baseURL = 'https://api.actransit.org/transit/actrealtime';
const url = `${baseURL}/prediction?tmres=s&stpid=${leaveFrom},${arriveAt}&rt=51B&token=${token}`;

const times = document.getElementById('times');

const fetchPredictions = async () => {
  const predictions = await fetch(url).then(extractPredictions).then(groupByVehicle);
  return Object.values(predictions)
    .filter(p => 'arrival' in p && 'departure' in p)
    .sort((a, b) => a.departure - b.departure);
};

const extractPredictions = async (resp) => {
  const data = await resp.json();
  return data['bustime-response'].prd;
};

const groupByVehicle = (predictions) => {
  const grouped = {};
  for (const p of predictions) {
    const { vid: vehicle, stpid: stop, prdtm: when } = p;
    if (!(vehicle in grouped)) {
      grouped[vehicle] = { vehicle };
    }
    const which = stop === leaveFrom ? 'departure' : 'arrival';
    grouped[vehicle][which] = parseTime(when);
  }
  return grouped;
};

const parseTime = (s) => {
  const m = s.match(/^(\d{4})(\d{2})(\d{2}) (.*)$/);
  return new Date(`${m.slice(1, 4).join('-')} ${m[4]}`);
};

const span = (x, cls) => {
  const s = document.createElement('span');
  s.append(x);
  if (cls) s.classList.add(cls);
  return s;
};

const fillTable = (busses) => {
  times.replaceChildren(...['Leave in', 'Bus in', 'Departs', 'Arrives'].map((s) => span(s, 'header')));
  const now = new Date();

  for (const v of busses) {
    const departIn = v.departure - now;
    if (departIn > 0) {
      const cls = departIn < millisToStop ? 'late' : 'ok';
      times.append(span(mmss(departIn - millisToStop), cls));
      times.append(span(mmss(departIn), cls));
      times.append(span(timeString(v.departure), cls));
      times.append(span(timeString(v.arrival), cls));
    }
  }
};

const timeString = (d) => {
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = ((h + 11) % 12) + 1;
  const mm = m.toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${hh}:${mm} ${ampm}`;
};

const mmss = (millis) => {
  const sign = Math.sign(millis);
  const seconds = Math.round(Math.abs(millis) / 1000);
  const minutes = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${sign < 0 ? '-' : ''}${minutes}:${ss.toString().padStart(2, '0')}`;
};

document.body.onclick = (e) => e.currentTarget.requestFullscreen();

let predictions = null;

const update = async () => {
  predictions = await fetchPredictions();
};

const fill = () => {
  fillTable(predictions);
};

// Kick things off
update().then(fill);

// Schedule polling of data and more frequent updating of countdowns
setInterval(update, 30 * 1000);
setInterval(fill, 1000);
