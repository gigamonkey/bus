const token = '3F7F44FFEDE5D6A98FB4443BF380514F';

const leaveFrom = '51583'; // University & California
const arriveAt = '51105'; // University & 6th

const minutesToStop = 7;

const url = `https://api.actransit.org/transit/actrealtime/prediction?stpid=${leaveFrom},${arriveAt}&rt=51B&token=${token}`;

const times = document.getElementById('times');

const extractPredictions = async (resp) => {
  const data = await resp.json();
  return data['bustime-response'].prd;
};

const parseTime = (s) => {
  const m = s.match(/^(\d{4})(\d{2})(\d{2}) (.*)$/);
  const d = new Date(`${m.slice(1, 4).join('-')} ${m[4]}`);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const ok = (v) => 'departure' in v && 'arrival' in v;

const fetchPredictions = async () => {
  const predictions = await fetch(url).then(extractPredictions);
  const byVehicle = {};
  for (const p of predictions) {
    const { vid: vehicle, stpid: stop, prdtm: when, prdctdn: minutes } = p;
    if (!(vehicle in byVehicle)) {
      byVehicle[vehicle] = { vehicle };
    }
    if (stop === leaveFrom) {
      byVehicle[vehicle].departure = parseTime(when);
      byVehicle[vehicle].departIn = Number(minutes);
      byVehicle[vehicle].label = minutes; // raw string
    } else {
      byVehicle[vehicle].arrival = parseTime(when);
      byVehicle[vehicle].arriveIn = Number(minutes);
    }
  }
  const vs = Object.values(byVehicle)
    .filter(ok)
    .sort((a, b) => a.departIn - b.departIn);
  return vs;
};

const span = (x, cls) => {
  const s = document.createElement('span');
  s.append(x);
  if (cls) s.classList.add(cls);
  return s;
};

const fillPredictions = (values) => {
  times.replaceChildren(span('Min.'), span('Leave'), span('Arrive'));
  for (const v of values) {
    const tooLate = Number.isNaN(v.departIn) || v.departIn < minutesToStop;
    const cls = tooLate ? 'late' : 'ok';
    times.append(span(Number.isNaN(v.departIn) ? v.label : v.departIn, cls));
    times.append(span(v.departure, cls));
    times.append(span(v.arrival, cls));
  }
};

const update = async () => {
  const p = await fetchPredictions();
  fillPredictions(p);
};

await update();

setInterval(update, 30000);
