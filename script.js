const token = '3F7F44FFEDE5D6A98FB4443BF380514F';
const url = `https://api.actransit.org/transit/actrealtime/prediction?stpid=51583&rt=51B&token=${token}`;

const body = document.body;
const times = document.getElementById('times');

const extractPredictions = async (resp) => {
  const data = await resp.json();
  return data['bustime-response'].prd;
};

const time = (p) => {
  const t = document.createElement('p');
  t.append(`${p.prdctdn} minutes`);
  return t;
};

const fetchPredictions = async () => {
  const predictions = await fetch(url).then(extractPredictions);
  times.replaceChildren(...predictions.map(time));
};

const totalHeight = (e) => [...e.children].reduce((acc, c) => acc + c.offsetHeight, 0);

await fetchPredictions();

const target = body.clientHeight * 0.8;

for (let s = 0; s < 200; s++) {
  body.style.fontSize = `${s}px`;
  if (totalHeight(body) > target) {
    body.style.fontSize = `${s - 1}px`;
    break;
  }
}

setInterval(fetchPredictions, 30000);
