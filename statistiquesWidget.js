export async function renderStatsWidget({ depot, studentId, year, month, type, container }) {
  container.innerHTML = `
    <div class="max-w-4xl mx-auto bg-white p-2 rounded shadow">

      <div class="flex justify-between mb-6">
        <h1 id="info" class="text-xl font-bold"></h1>
      </div>
    
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="p-4 bg-blue-50 rounded shadow text-center">
          <div class="text-sm text-gray-600">متوسط الشهر</div>
          <div id="avgMonth" class="text-2xl font-bold">--</div>
        </div>

        <div class="p-4 bg-green-50 rounded shadow text-center">
          <div class="text-sm text-gray-600">متوسط السنة</div>
          <div id="avgYear" class="text-2xl font-bold">--</div>
        </div>

        <div class="p-4 bg-yellow-50 rounded shadow text-center">
          <div class="text-sm text-gray-600">متوسط الأسبوع ١</div>
          <div id="week1" class="text-2xl font-bold">--</div>
        </div>

        <div class="p-4 bg-yellow-50 rounded shadow text-center">
          <div class="text-sm text-gray-600">متوسط الأسبوع ٢</div>
          <div id="week2" class="text-2xl font-bold">--</div>
        </div>

        <div class="p-4 bg-yellow-50 rounded shadow text-center">
          <div class="text-sm text-gray-600">متوسط الأسبوع ٣</div>
          <div id="week3" class="text-2xl font-bold">--</div>
        </div>

        <div class="p-4 bg-yellow-50 rounded shadow text-center">
          <div class="text-sm text-gray-600">متوسط الأسبوع ٤</div>
          <div id="week4" class="text-2xl font-bold">--</div>
        </div>
      </div>

      <h2 class="text-lg font-bold mb-2">منحنى تطور النتائج</h2>
      <canvas id="lineChart" class="mb-8"></canvas>
      <h2 class="text-lg font-bold mb-2">مقارنة الأيام</h2>
      <canvas id="dayChart" class="mb-8"></canvas>
      <h2 class="text-lg font-bold mb-2">توزيع التقديرات</h2>
      <canvas id="evalChart"></canvas>
    </div>
  `;

  // Import Firebase
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const { getDatabase, ref, get, child } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  const firebaseConfig = {
    apiKey: "AIzaSyDvvWNXn3Wht_6ki-uhbdkGzQTRa71HTTk",
    authDomain: "programme-hebdomadaire.firebaseapp.com",
    databaseURL: "https://programme-hebdomadaire-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "programme-hebdomadaire",
    storageBucket: "programme-hebdomadaire.firebasestorage.app",
    messagingSenderId: "476978354022",
    appId: "1:476978354022:web:6514dba81ee84fc4f15aa7",
    measurementId: "G-08HV2ZXPW"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  document.getElementById("info").textContent =
    `إحصائيات شهر ${Number(month)+1} لسنة ${year}`;

  // Firebase path
  const path = `students/${depot}/${studentId}/${year}/${month}`;
  const snapshot = await get(child(ref(db), path));
  if (!snapshot.exists()) return;
  const data = snapshot.val();
  let totals = [];
  let byWeek = {};
  let byDay = {0:[],1:[],2:[],3:[],4:[]};
  let evalCount = {A:0,B:0,C:0,D:0,E:0};
  const evalLabel = t =>
    t>=16?"A":t>=14?"B":t>=12?"C":t>=10?"D":"E";

  for (let week in data) {
    for (let row in data[week]) {
      const rowData = data[week][row];
      if (!rowData[type]) continue;
      const r = rowData[type];
      if (r.total === null || r.total === undefined) continue;
      const t = Number(r.total);
      totals.push(t);
      if (!byWeek[week]) byWeek[week] = [];
      byWeek[week].push(t);
      byDay[row].push(t);
      evalCount[evalLabel(t)]++;
    }
  }

  const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : "--";
  document.getElementById("avgMonth").textContent = avg(totals);
  document.getElementById("avgYear").textContent = avg(totals);
  document.getElementById("week1").textContent = avg(byWeek[1]);
  document.getElementById("week2").textContent = avg(byWeek[2]);
  document.getElementById("week3").textContent = avg(byWeek[3]);
  document.getElementById("week4").textContent = avg(byWeek[4]);

  // Charts
  new Chart(document.getElementById("lineChart"),{
    type:"line",
    data:{
      labels: totals.map((_,i)=>`اليوم ${i+1}`),
      datasets:[{
        data: totals,
        borderWidth:2,
        tension:0.3,
        borderColor: "#0369a1",
        backgroundColor: "rgba(3,105,161,0.2)",
        fill: true
      }]
    },
    options:{ plugins:{ legend:{ display:false } } }
  });

  new Chart(document.getElementById("dayChart"),{
    type:"bar",
    data:{
      labels:["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس"],
      datasets:[{
        data:[
          avg(byDay[0]),
          avg(byDay[1]),
          avg(byDay[2]),
          avg(byDay[3]),
          avg(byDay[4])
        ],
        borderWidth:1,
        backgroundColor: "#0369a1"
      }]
    },
    options:{ plugins:{ legend:{ display:false } } }
  });

  new Chart(document.getElementById("evalChart"),{
    type:"bar",
    data:{
      labels:["ممتاز","جيد جدا","جيد","مقبول","راسب"],
      datasets:[{
        data:[
          evalCount.A,
          evalCount.B,
          evalCount.C,
          evalCount.D,
          evalCount.E
        ],
        borderWidth:1,
        backgroundColor: "#0369a1"
      }]
    },
    options:{ 
      plugins:{ legend:{ display:false } },
      scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } }
    }
  });
}
