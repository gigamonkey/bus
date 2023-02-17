const token = '3F7F44FFEDE5D6A98FB4443BF380514F';

const leaveFrom = '51583'; // University & California
const arriveAt = '51105'; // University & 6th

const millisToStop = 7 * 60 * 1000;

const url = `https://api.actransit.org/transit/actrealtime/prediction?tmres=s&stpid=${leaveFrom},${arriveAt}&rt=51B&token=${token}`;

const times = document.getElementById('times');

const extractPredictions = async (resp) => {
  const data = await resp.json();
  return data['bustime-response'].prd;
};

const parseTime = (s) => {
  const m = s.match(/^(\d{4})(\d{2})(\d{2}) (.*)$/);
  return new Date(`${m.slice(1, 4).join('-')} ${m[4]}`);
};

const timeString = (d) => {
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const mmss = (millis) => {
  const seconds = Math.round(millis / 1000);
  const minutes = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${minutes}:${ss.toString().padStart(2, '0')}`;
};

const ok = (v) => 'departure' in v && 'arrival' in v;

const fetchPredictions = async () => {
  const predictions = await fetch(url).then(extractPredictions);
  const byVehicle = {};
  for (const p of predictions) {
    const { vid: vehicle, stpid: stop, prdtm: when } = p;
    if (!(vehicle in byVehicle)) {
      byVehicle[vehicle] = { vehicle };
    }
    const which = stop === leaveFrom ? 'departure' : 'arrival';
    byVehicle[vehicle][which] = parseTime(when);
  }
  const vs = Object.values(byVehicle)
    .filter(ok)
    .sort((a, b) => a.departure - b.departure);
  return vs;
};

const span = (x, cls) => {
  const s = document.createElement('span');
  s.append(x);
  if (cls) s.classList.add(cls);
  return s;
};

const fillPredictions = (values) => {
  times.replaceChildren(...['Minutes', 'Depart', 'Arrive'].map((s) => span(s, 'header')));
  const now = new Date();
  for (const v of values) {
    const departIn = v.departure - now;
    const cls = departIn < millisToStop ? 'late' : 'ok';
    const millis = v.departure.getTime() - now;
    times.append(span(mmss(millis), cls));
    times.append(span(timeString(v.departure), cls));
    times.append(span(timeString(v.arrival), cls));
  }
};

let predictions = await fetchPredictions();

setInterval(async () => {
  predictions = await fetchPredictions();
}, 30000);
setInterval(() => fillPredictions(predictions), 1000);
