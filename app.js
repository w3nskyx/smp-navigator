
(() => {
  const app = document.getElementById("app");
  const D = window.SMP_DATA;
  const state = {
    screen: "home",
    protocol: null,
    tab: "diag",
    mode: localStorage.getItem("smp_mode") || "brief",
    theme: localStorage.getItem("smp_theme") || "light",
    nav: "algorithms",
    strategy: "pci",
    favorite: localStorage.getItem("fav_stemi") === "1",
    drugQuery: ""
  };

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

  function telegramInit(){
    try{
      const tg = window.Telegram?.WebApp;
      tg?.ready();
      tg?.expand();
      tg?.setHeaderColor?.(state.theme === "dark" ? "#0e1514" : "#f4f7f7");
      tg?.setBackgroundColor?.(state.theme === "dark" ? "#0e1514" : "#f4f7f7");
    }catch(e){}
  }

  function applyPrefs(){
    document.documentElement.dataset.theme = state.theme;
    document.body.classList.toggle("brief", state.mode === "brief");
    localStorage.setItem("smp_mode", state.mode);
    localStorage.setItem("smp_theme", state.theme);
  }

  function logo(){
    return `<div class="logo" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M3 17h6l3-8 5 15 4-11 3 4h5" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`;
  }

  function shell(content){
    const nav = state.screen === "protocol" ? "" : bottomNav();
    return `<div class="app-shell">
      <header class="topbar">
        <div class="brand">${logo()}<div><div class="brand-title">СМП Навигатор</div><div class="brand-sub">догоспитальный этап</div></div></div>
        <div class="actions">
          <button class="icon-btn" data-action="toggle-mode" title="Кратко / подробно">${state.mode === "brief" ? "К" : "П"}</button>
          <button class="icon-btn" data-action="toggle-theme" title="Тема">${state.theme === "dark" ? "☀️" : "🌙"}</button>
        </div>
      </header>
      <main class="content">${content}</main>
      ${nav}
    </div>`;
  }

  function bottomNav(){
    const items = [
      ["algorithms","📋","Алгоритмы"],
      ["drugs","💊","Препараты"],
      ["scales","📐","Шкалы"],
      ["favorites","★","Избранное"]
    ];
    return `<nav class="bottom-nav">${items.map(([id,ic,t]) =>
      `<button class="nav-btn ${state.nav===id?"active":""}" data-nav="${id}">
        <span class="nicon">${ic}</span>${t}
      </button>`).join("")}</nav>`;
  }

  function home(){
    if(state.nav === "drugs") return drugsView();
    if(state.nav === "scales") return scalesView();
    if(state.nav === "favorites") return favoritesView();

    return `
      <section class="hero">
        <h1>Клинические алгоритмы СМП</h1>
        <p>Быстрый доступ к действиям, дозам и тактике без длинного поиска по документам.</p>
        <div class="hero-tags"><span class="hero-tag">6 протоколов</span><span class="hero-tag">Кратко / подробно</span><span class="hero-tag">КР157_5 обновлено</span><span class="hero-tag">β BETA</span></div>
      </section>
      <div class="section-title">Догоспитальный этап</div>
      <div class="protocol-list">
        ${D.protocols.map(p => `<button class="protocol-card" data-protocol="${p.id}">
          <span class="protocol-icon">${p.icon}</span>
          <span class="protocol-meta"><span class="protocol-name">${p.title}</span><span class="protocol-sub">${p.sub}</span></span>
          <span class="badge ${p.status}">${p.status==="active"?"ГОТОВО":"СКОРО"}</span>
        </button>`).join("")}
      </div>
      <div class="footer-note">Тестовая версия. Медицинские материалы проходят клиническую проверку и не заменяют локальные СОП, приказы и клиническое решение специалиста.</div>
    `;
  }

  function drugsView(){
    const q = state.drugQuery.trim().toLowerCase();
    const rows = D.drugs.filter(d => !q || (d.name+" "+d.info).toLowerCase().includes(q));
    return `
      <div class="section-title" style="margin-top:2px">Препараты</div>
      <input class="search" data-search-drugs placeholder="Поиск по МНН или дозировке…" value="${esc(state.drugQuery)}">
      <div class="tool-card">
        ${rows.length ? rows.map(d=>`<div class="drug-row"><strong>${d.name}</strong><span>${d.info}</span></div>`).join("") : `<div class="empty">Ничего не найдено</div>`}
      </div>
      <div class="footer-note">Дозировки в этом разделе пока заполнены для протокола STEMI по КР157_5.</div>`;
  }

  function scalesView(){
    return `<div class="section-title" style="margin-top:2px">Шкалы</div>
      <div class="tool-card">
        <strong>LAMS и другие шкалы</strong>
        <p class="muted" style="font-size:13px;line-height:1.5;margin-bottom:0">В этой восстановленной версии навигация сохранена, но клиническое наполнение шкал не менялось по PDF КР157_5 и будет перенесено отдельным этапом из профильных источников.</p>
      </div>`;
  }

  function favoritesView(){
    return `<div class="section-title" style="margin-top:2px">Избранное</div>
      ${state.favorite ? `<button class="protocol-card" data-protocol="stemi">
        <span class="protocol-icon">❤️</span><span class="protocol-meta"><span class="protocol-name">ОКС с подъёмом ST</span><span class="protocol-sub">STEMI · взрослые</span></span><span class="badge active">★</span>
      </button>` : `<div class="empty">Пока пусто. Добавь протокол звёздочкой.</div>`}`;
  }

  function protocolView(){
    if(state.protocol === "nstemi") return nstemiProtocolView();
    return stemiProtocolView();
  }

  function stemiProtocolView(){
    return `
      <div class="detail-header">
        <button class="back-btn" data-action="back">←</button>
        <div class="detail-title"><h1>ОКС с подъёмом ST</h1><p>STEMI · взрослые · догоспитальный этап</p></div>
        <button class="favorite-btn ${state.favorite?"on":""}" data-action="favorite">${state.favorite?"♥":"♡"}</button>
      </div>

      <div class="segmented">
        <button class="seg-btn ${state.mode==="brief"?"active":""}" data-mode="brief">Кратко</button>
        <button class="seg-btn ${state.mode==="full"?"active":""}" data-mode="full">Подробно</button>
      </div>

      <div class="tabs">
        <button class="tab-btn ${state.tab==="diag"?"active":""}" data-tab="diag">Диагностика</button>
        <button class="tab-btn ${state.tab==="tx"?"active":""}" data-tab="tx">Лечение</button>
        <button class="tab-btn ${state.tab==="tactics"?"active":""}" data-tab="tactics">Тактика</button>
      </div>

      ${state.tab==="diag" ? diagTab() : state.tab==="tx" ? treatmentTab() : tacticsTab()}

      <div class="footer-note">Основание: ${D.meta.source}. Версия 1.1.2 BETA.</div>
    `;
  }

  function nstemiProtocolView(){
    return `
      <div class="detail-header">
        <button class="back-btn" data-action="back">←</button>
        <div class="detail-title"><h1>ОКС без подъёма ST</h1><p>ОКСбпST · взрослые · догоспитальный этап</p></div>
      </div>

      <div class="segmented">
        <button class="seg-btn ${state.mode==="brief"?"active":""}" data-mode="brief">Кратко</button>
        <button class="seg-btn ${state.mode==="full"?"active":""}" data-mode="full">Подробно</button>
      </div>

      <div class="tabs">
        <button class="tab-btn ${state.tab==="diag"?"active":""}" data-tab="diag">Диагностика</button>
        <button class="tab-btn ${state.tab==="tx"?"active":""}" data-tab="tx">Лечение</button>
        <button class="tab-btn ${state.tab==="tactics"?"active":""}" data-tab="tactics">Тактика</button>
      </div>

      ${state.tab==="diag" ? nstemiDiagTab() : state.tab==="tx" ? nstemiTreatmentTab() : nstemiTacticsTab()}
      <div class="footer-note">Источник: KR_154_4. Версия 1.1.2 BETA.</div>
    `;
  }

  function card(i,title,sub,body,source){
    return `<section class="card">
      <div class="card-head"><div class="card-index">${i}</div><div class="card-main"><div class="card-title">${title}</div>${sub?`<div class="card-sub">${sub}</div>`:""}</div></div>
      <div class="card-body">${body}${source?`<div class="source details">${source}</div>`:""}</div>
    </section>`;
  }

  function nstemiDiagTab(){
    return `
      ${card("1","Первичная оценка","Жалобы, анамнез, физикальное обследование",`
        <p>Собрать жалобы и анамнез, оценить болевой синдром. Провести физикальное обследование. Контролировать АД и ЧСС.</p>
        <p>ОКСбпST следует подозревать, в частности, при:</p>
        <ul>
          <li>ангинозном приступе в покое продолжительностью <strong>&gt;20 минут</strong>;</li>
          <li>впервые возникшей стенокардии как минимум <strong>II ФК</strong>;</li>
          <li>утяжелении ранее стабильной стенокардии как минимум до <strong>III ФК</strong>;</li>
          <li>стенокардии, появившейся в первые <strong>2 недели после ИМ</strong>.</li>
        </ul>
        <p>Возможны атипичные/доминирующие проявления: одышка, боль в эпигастрии, тошнота, головокружение, слабость.</p>
        <div class="notice warn"><strong>Важно:</strong> положительный эффект нитроглицерина не исключает ОКСбпST.</div>
      `,`KR_154_4: стр. 23–26; Приложение Б2, стр. 221.`)}

      ${card("2","ЭКГ","12 отведений как можно раньше",`
        <p>Зарегистрировать ЭКГ в <strong>12 отведениях</strong> как можно раньше — в течение <span class="dose">10 минут</span> от начала первичного медицинского контакта.</p>
        <p>Для ОКСбпST характерны в том числе:</p>
        <ul>
          <li>преходящий подъём ST продолжительностью <strong>&lt;20 минут</strong> как минимум в двух смежных отведениях;</li>
          <li>преходящая или стойкая депрессия ST <strong>≥0,05 мВ</strong> как минимум в двух смежных отведениях;</li>
          <li>инверсия T <strong>&gt;0,1 мВ</strong> как минимум в двух смежных отведениях;</li>
          <li>выраженные симметричные отрицательные T <strong>≥0,2 мВ</strong> в прекордиальных отведениях с высокой вероятностью указывают на острую ишемию миокарда.</li>
        </ul>
        <div class="notice warn"><strong>Важно:</strong> отсутствие ишемических изменений на ЭКГ не исключает ОКСбпST.</div>
        <p>При необходимости и возможности — дистанционная консультация ЭКГ. Для фельдшерской бригады КР отдельно указывает обязательную передачу ЭКГ в специализированный телемедицинский центр для согласования ведения и маршрутизации.</p>
      `,`KR_154_4: стр. 32–33; раздел 2.4; стр. 110; раздел 6.1; Приложение Б2, стр. 221.`)}

      ${card("3","Догоспитальный этап","Мониторирование и ограничения диагностики",`
        <ul>
          <li>Начать непрерывное мониторирование ЭКГ.</li>
          <li>Обеспечить в/в доступ.</li>
          <li>Обеспечить готовность к дефибрилляции и сердечно-лёгочной реанимации.</li>
          <li>Ограничить двигательную активность.</li>
        </ul>
        <div class="notice info">Для подтверждения/исключения ОКСбпST на догоспитальном этапе КР не рекомендует другие инструментальные или лабораторные диагностические мероприятия, кроме ЭКГ. В частности, определение маркеров повреждения миокарда на этом этапе названо нецелесообразным.</div>
      `,`KR_154_4: стр. 110; раздел 6.1; Приложение Б2, стр. 221.`)}
    `;
  }

  function nstemiTreatmentTab(){
    return `
      ${card("1","Нитроглицерин","При болевом синдроме — при отсутствии гипотонии и других противопоказаний",`
        <p><span class="dose">0,4–0,5 мг</span> под язык в таблетке или в виде аэрозоля/спрея.</p>
        <ul>
          <li>Если через <strong>5 минут</strong> симптомы сохраняются и препарат переносится удовлетворительно — можно повторить.</li>
          <li>Если боль сохраняется после <strong>3 приёмов</strong>, дальнейший приём не имеет смысла; перейти к наркотическому анальгетику.</li>
          <li>Постоянно контролировать АД из-за риска артериальной гипотонии.</li>
        </ul>
      `,`KR_154_4: стр. 49; раздел 3.2.1; Приложение Б2, стр. 222.`)}

      ${card("2","Морфин","Если болевой синдром сохраняется после 3 приёмов нитроглицерина",`
        <p><strong>Морфин в/в медленно <span class="dose">2–4 мг</span>.</strong></p>
        <p>Перед введением <span class="dose">10 мг</span> морфина развести как минимум в <span class="dose">10 мл 0,9% раствора натрия хлорида</span>.</p>
        <p>При необходимости повторять по <span class="dose">2–4 мг каждые 5–15 минут</span> до купирования боли или появления побочных эффектов, не позволяющих увеличивать дозу.</p>
        <p>Доза для адекватного обезболивания подбирается индивидуально.</p>
        <div class="notice warn"><strong>Предупреждение:</strong> морфин может замедлять и ослаблять основной эффект клопидогрела, тикагрелора и прасугрела.</div>
      `,`KR_154_4: стр. 48–50; раздел 3.2.1; Приложение Б2, стр. 222.`)}

      ${card("3","Ацетилсалициловая кислота","Рассмотреть при отсутствии противопоказаний",`
        <p>Рассмотреть применение АСК <span class="dose">150–300 мг</span>, разжевать.</p>
        <p>Не рекомендуется использовать кишечнорастворимую лекарственную форму.</p>
        <div class="notice warn details"><strong>Важно:</strong> основной текст КР отдельно отмечает, что начало применения АСК при ОКСбпST на догоспитальном этапе не имеет доказательств эффективности и безопасности в сравнении с изученным применением в стационаре. При этом специализированный догоспитальный алгоритм Б2 прямо предлагает рассмотреть АСК при отсутствии противопоказаний — поэтому сохранена формулировка «рассмотреть», а не «обязательно дать».</div>
      `,`KR_154_4: стр. 51; раздел 3.2.3.1; Приложение Б2, стр. 222.`)}

      <div class="notice danger"><strong>Не применять рутинно на догоспитальном этапе:</strong> ингибитор P2Y12-рецептора тромбоцитов и антикоагулянты — не рекомендуются. Тромболитическая терапия при ОКСбпST не рекомендуется.</div>
      <div class="notice warn details">Основной текст КР отдельно указывает, что начало применения ингибиторов P2Y12 на догоспитальном этапе не имеет доказательств эффективности и безопасности по сравнению с изученным применением в стационаре.</div>
      <div class="source details">KR_154_4: стр. 52; раздел 3.2.3.1; Приложение Б2, стр. 222.</div>
    `;
  }

  function nstemiTacticsTab(){
    return `
      ${card("1","Экстренная госпитализация","Показана при любом подозрении на ОКСбпST",`
        <p>Госпитализация — в стационар, включённый в систему маршрутизации пациентов с ОКС. Маршрутизация должна обеспечивать госпитализацию либо максимально быстрый перевод в стационар с возможностью инвазивного лечения ОКС.</p>
      `,`KR_154_4: стр. 110; раздел 6.1; Приложение Б2, стр. 222.`)}

      ${card("2","Высокий риск","Экстренная госпитализация в стационар с возможностью ЧКВ",`
        <p>При наличии хотя бы одного из признаков высокого риска, однозначно подтверждённых в догоспитальном алгоритме:</p>
        <ul>
          <li>стойкий или рецидивирующий болевой синдром;</li>
          <li>нестабильная гемодинамика / шок;</li>
          <li>отёк лёгких;</li>
          <li>угрожающие жизни желудочковые аритмии;</li>
          <li>угрожающие жизни нарушения внутрисердечной проводимости;</li>
          <li>остановка кровообращения;</li>
          <li>подозрение на механические осложнения ИМ —</li>
        </ul>
        <p>показана экстренная госпитализация в стационар, где возможно выполнение ЧКВ в течение <span class="dose">2 часов после госпитализации</span>.</p>
        <p>Следует информировать принимающий стационар о транспортировке нестабильного пациента.</p>
      `,`KR_154_4: Приложение Б2, стр. 222.`)}

      ${card("3","Документирование","Карта вызова и сопроводительный талон",`
        <p>Указать:</p>
        <ul>
          <li>время начала ОКС;</li>
          <li>время первого медицинского контакта;</li>
          <li>время регистрации ЭКГ;</li>
          <li>проведённое на догоспитальном этапе лечение с дозами препаратов;</li>
          <li>время доставки в стационар;</li>
          <li>если известно — препараты, принятые пациентом за ближайшие <strong>24 часа</strong>, время их приёма и дозы.</li>
        </ul>
      `,`KR_154_4: Приложение Б2, стр. 223.`)}
    `;
  }

  function diagTab(){
    return `
      <div class="notice info"><strong>Цель:</strong> подтвердить подозрение на ОКСпST максимально быстро и сразу определить реперфузионную стратегию.</div>
      ${card("1","Жалобы и анамнез","Оценить болевой синдром и его эквиваленты",`
        <ul>
          <li>Характер, интенсивность и время начала симптомов.</li>
          <li>Иррадиация, одышка, тошнота, слабость, синкопе и другие возможные эквиваленты ишемии.</li>
          <li>Фиксировать время от начала болевого эпизода до первичного медицинского контакта.</li>
        </ul>`,`КР157_5: раздел 2.1, стр. 21.`)}
      ${card("2","Физикальное обследование","АД, ЧСС и поиск осложнений",`
        <ul>
          <li>Контроль гемодинамики: АД, ЧСС.</li>
          <li>Оценка признаков ОСН, шока, нарушений ритма и альтернативных причин симптомов.</li>
          <li>Ограничить двигательную активность.</li>
        </ul>`,`КР157_5: Приложение Б4, стр. 210.`)}
      ${card("3","ЭКГ ≤ 10 минут","Минимум 12 стандартных отведений",`
        <ul>
          <li><strong>Регистрация и интерпретация ЭКГ — в течение 10 минут</strong> от начала первичного медицинского контакта.</li>
          <li>При затруднённой интерпретации — дистанционная/телемедицинская консультация при возможности.</li>
          <li class="secondary">Повторная ЭКГ целесообразна при изменении характера боли или клиники ОКС.</li>
        </ul>`,`КР157_5: раздел 2.4, стр. 26–27; Приложение Б4.`)}
      ${card("4","Мониторирование и готовность","Не терять время до реперфузии",`
        <ul>
          <li>Начать непрерывное мониторирование ЭКГ.</li>
          <li>Обеспечить внутривенный доступ.</li>
          <li>Готовность к дефибрилляции и СЛР.</li>
        </ul>`,`КР157_5: Приложение Б4, стр. 210.`)}
      <div class="notice warn details"><strong>Тропонин:</strong> лабораторное подтверждение ИМ не должно задерживать ключевые решения по ЧКВ или ТЛТ при клинике ОКСпST и соответствующей ЭКГ.</div>
    `;
  }

  function treatmentTab(){
    return `
      <div class="notice info"><strong>Важно:</strong> лечение ниже привязано к догоспитальному этапу. Антитромботическая схема меняется в зависимости от выбранной стратегии реперфузии.</div>

      ${card("1","Нитроглицерин — сублингвально","Купирование боли при отсутствии противопоказаний",`
        <p><span class="dose">0,4–0,5 мг</span> под язык или аэрозоль (спрей).</p>
        <ul>
          <li>Если симптомы сохраняются через 5 минут и препарат хорошо переносится — можно повторить.</li>
          <li>Постоянно контролировать АД.</li>
          <li class="details">Если 2–3 приёма не уменьшают интенсивность приступа, дальнейший приём не имеет смысла.</li>
        </ul>
        <div class="notice danger"><strong>Не применять:</strong> при артериальной гипотонии и других противопоказаниях к нитратам.</div>
      `,`КР157_5: раздел 3.2.1, стр. 46; Приложение Б4, стр. 211.`)}

      ${card("2","Морфин — при интенсивной/сохраняющейся боли","Если нитроглицерин неэффективен или боль интенсивная",`
        <p>Перед использованием <span class="dose">10 мг</span> морфина развести минимум в <span class="dose">10 мл NaCl 0,9%</span>.</p>
        <p>Начать <span class="dose">2–4 мг в/в медленно</span>; при необходимости повторять <span class="dose">2–4 мг каждые 5–15 минут</span> до купирования боли или появления ограничивающих побочных эффектов.</p>
        <div class="notice warn details"><strong>Взаимодействие:</strong> морфин может замедлять и ослаблять основной эффект клопидогрела, тикагрелора и прасугрела.</div>
      `,`КР157_5: раздел 3.2.1, стр. 46–47; Приложение Б4, стр. 211.`)}

      ${card("3","Выраженное возбуждение","Транквилизатор — только при выраженных симптомах",`
        <p>Диазепам: <span class="dose">5–10 мг в/в</span>; для пожилых стартовая доза <span class="dose">2,5 мг</span>.</p>
        <p class="details muted">Для уменьшения страха обычно достаточно спокойной обстановки и адекватного обезболивания.</p>
      `,`КР157_5: раздел 3.2.1, стр. 47.`)}

      ${card("4","Кислород — только при гипоксемии","Не рутинно всем пациентам",`
        <p>Показание: <span class="dose">SpO₂ &lt; 90%</span> или <span class="dose">PaO₂ &lt; 60 мм рт. ст.</span></p>
        <p>Увлажнённый кислород через носовые катетеры <span class="dose">2–8 л/мин</span> с контролем сатурации.</p>
        <div class="notice danger"><strong>При SpO₂ ≥ 90%</strong> рутинная оксигенотерапия не рекомендуется.</div>
      `,`КР157_5: раздел 3.2.2, стр. 47–48.`)}

      ${card("5","Нитраты — в/в инфузия","Не рутинно: продолжающаяся ишемия, АГ или сердечная недостаточность",`
        <p>Нитроглицерин: начальная скорость <span class="dose">10 мкг/мин</span>.</p>
        <p>При недостаточном эффекте увеличивать на <span class="dose">10–15 мкг/мин каждые 5–10 минут</span> до желаемого эффекта.</p>
        <ul class="details">
          <li>Цель снижения САД: на 10–15% у нормотоников, на 25–30% при АГ, но <strong>не ниже 100 мм рт. ст.</strong></li>
          <li>При скорости до 166 мкг/мин без нужного эффекта дальнейшее увеличение не имеет смысла.</li>
        </ul>
        <div class="notice danger"><strong>Противопоказано:</strong> артериальная гипотония, ИМ правого желудочка, силденафил/варденафил в предшествующие 24 ч, тадалафил в предшествующие 48 ч.</div>
      `,`КР157_5: раздел 3.2.4, стр. 67–68.`)}

      ${card("6","Бета-блокатор — по показаниям","Подтверждено КР157_5: преимущественно метопролол",`
        <p>Показания в КР: <strong>АГ и/или сохраняющаяся ишемия миокарда и/или тахикардия</strong> при отсутствии признаков ОСН и противопоказаний.</p>
        <p>Метопролол: <span class="dose">5 мг в/в медленно</span> под контролем ЭКГ и АД, <span class="dose">2–3 раза</span> с интервалом не менее <span class="dose">2 минут</span>.</p>
        <div class="notice danger"><strong>Не использовать / соблюдать осторожность:</strong> кардиогенный шок, АВ-блокада II–III степени без ЭКС, выраженная бронхообструкция; также учитывать САД &lt;100 мм рт. ст., ЧСС &lt;60/мин, признаки СН/низкого выброса и риск кардиогенного шока.</div>
      `,`КР157_5: раздел 3.2.5, стр. 68–70; дозировка метопролола — Приложение А3.`)}

      <div class="strategy-box">
        <h3>Антитромботическая терапия по стратегии</h3>
        ${strategyButtons()}
        <div class="strategy-panel">${strategyTreatment()}</div>
      </div>
    `;
  }

  function strategyButtons(){
    const items = [
      ["pci","Первичное ЧКВ","≤120 мин до проводника"],
      ["tlt","Догоспитальная ТЛТ","ЧКВ своевременно недоступно"],
      ["none","Без реперфузии","ТЛТ противопоказана + ЧКВ недоступно"]
    ];
    return `<div class="strategy-grid">${items.map(([id,a,b])=>`<button class="strategy-btn ${state.strategy===id?"active":""}" data-strategy="${id}"><strong>${a}</strong><span>${b}</span></button>`).join("")}</div>`;
  }

  function strategyTreatment(){
    if(state.strategy === "pci"){
      return `
        <div class="notice info"><strong>Первичное ЧКВ:</strong> стратегия выбора, если ожидаемое время от диагноза до проводника <strong>&lt;120 мин</strong>; альтернативный ориентир — транспортировка ≤60 мин.</div>
        ${miniDrug("АСК","150–300 мг","разжевать; не использовать кишечнорастворимую форму для нагрузочной дозы")}
        ${miniDrug("Клопидогрел","600 мг","возможный дополнительный приём на догоспитальном этапе")}
        ${miniDrug("или тикагрелор","180 мг","возможный дополнительный приём")}
        <div class="notice warn details">Неназначение ингибитора P2Y12 на догоспитальном этапе при стратегии первичного ЧКВ в Приложении Б4 не считается лечебной ошибкой: преимущество догоспитального назначения перед стационарным не доказано.</div>`;
    }
    if(state.strategy === "tlt"){
      return `
        <div class="notice warn"><strong>ТЛТ:</strong> если первичное ЧКВ невозможно выполнить в течение 120 мин и от начала симптомов прошло ≤12 ч, тромболитик следует начать максимально быстро, ориентир — <strong>≤10 мин от постановки диагноза</strong>, при отсутствии противопоказаний.</div>
        ${miniDrug("АСК","150–300 мг","разжевать")}
        ${miniDrug("Клопидогрел","300 мг","пациентам старше 75 лет — 75 мг")}
        ${miniDrug("Антикоагулянт","эноксапарин натрия — предпочтительно","альтернатива: НФГ; дозы ниже")}
        ${tltTables()}
        <div class="notice danger"><strong>Контроль через 60–90 мин:</strong> если снижение подъёма ST &lt;50% от исходного — ТЛТ безуспешна → срочная КГ с намерением выполнить «спасающее» ЧКВ. Повторная системная ТЛТ не рекомендуется.</div>`;
    }
    return `
      <div class="notice danger"><strong>Догоспитальный алгоритм Б4:</strong> если ТЛТ противопоказана и своевременное первичное ЧКВ недоступно.</div>
      ${miniDrug("АСК","150–300 мг","разжевать; при отсутствии противопоказаний")}
      <div class="notice warn"><strong>На догоспитальном этапе по Приложению Б4:</strong> ингибиторы P2Y12 и антикоагулянты не применяются в этой ветке.</div>
      <div class="notice info details">В основном тексте КР обсуждается последующая антитромботическая терапия пациентов без реперфузии; эта карточка намеренно отражает именно догоспитальный алгоритм Приложения Б4.</div>`;
  }

  function miniDrug(name,dose,note){
    return `<div class="card" style="box-shadow:none"><div class="card-head"><div class="card-main"><div class="card-title">${name}</div><div class="card-sub"><span class="dose">${dose}</span> · ${note}</div></div></div></div>`;
  }

  function tltTables(){
    return `
      <div class="details">
        <div class="section-title">Тенектеплаза — однократный в/в болюс</div>
        <div class="table-wrap"><table class="dose-table">
          <thead><tr><th>Масса тела</th><th>Доза</th></tr></thead>
          <tbody>
            <tr><td>&lt;60 кг</td><td><strong>30 мг</strong></td></tr>
            <tr><td>60–&lt;70 кг</td><td><strong>35 мг</strong></td></tr>
            <tr><td>70–&lt;80 кг</td><td><strong>40 мг</strong></td></tr>
            <tr><td>80–&lt;90 кг</td><td><strong>45 мг</strong></td></tr>
            <tr><td>≥90 кг</td><td><strong>50 мг</strong></td></tr>
          </tbody>
        </table></div>
        <div class="notice warn">У пациентов старше 75 лет при использовании тенектеплазы КР допускает половинную дозу для снижения риска кровотечений.</div>

        <div class="section-title">Алтеплаза</div>
        <div class="table-wrap"><table class="dose-table">
          <thead><tr><th>Время от симптомов</th><th>Режим</th></tr></thead>
          <tbody>
            <tr><td>≤6 ч</td><td>15 мг в/в струйно → 50 мг за 30 мин → 35 мг за 60 мин; максимум 100 мг. При массе &lt;65 кг: 15 мг струйно → 0,75 мг/кг (макс. 50 мг) за 30 мин → 0,5 мг/кг (макс. 35 мг) за 60 мин.</td></tr>
            <tr><td>6–12 ч</td><td>10 мг в/в струйно → 50 мг за 1 ч → далее 10 мг каждые 30 мин до общей максимальной дозы 100 мг за 3 ч. При массе &lt;65 кг общая доза ≤1,5 мг/кг.</td></tr>
          </tbody>
        </table></div>

        <div class="section-title">Эноксапарин при ТЛТ</div>
        <div class="table-wrap"><table class="dose-table">
          <thead><tr><th>Группа</th><th>Режим</th></tr></thead>
          <tbody>
            <tr><td>&lt;75 лет</td><td>30 мг в/в болюс; через 15 мин — 1 мг/кг п/к 2 раза/сут. Первые 2 п/к дозы ≤100 мг.</td></tr>
            <tr><td>≥75 лет</td><td>Без начального в/в болюса; 0,75 мг/кг п/к 2 раза/сут. Первые 2 дозы ≤75 мг.</td></tr>
            <tr><td>КлКр &lt;30 мл/мин</td><td>1 мг/кг п/к 1 раз/сут вне зависимости от возраста.</td></tr>
          </tbody>
        </table></div>

        <div class="section-title">НФГ при ТЛТ — альтернатива</div>
        <div class="notice info">Болюс <strong>60 ЕД/кг</strong> (макс. 4000 ЕД), затем инфузия <strong>12 ЕД/кг/ч</strong> (макс. 1000 ЕД/ч) с последующим подбором по АЧТВ.</div>
      </div>`;
  }

  function tacticsTab(){
    return `
      <div class="strategy-box">
        <h3>Выбор реперфузии</h3>
        ${strategyButtons()}
        <div class="strategy-panel">${strategyTactics()}</div>
      </div>

      ${card("1","Экстренная госпитализация","Маршрутизация пациента с ОКС",`
        <ul>
          <li>Госпитализация в стационар, включённый в систему маршрутизации пациентов с ОКС.</li>
          <li>Предпочтительно — учреждение с возможностью срочного ЧКВ.</li>
          <li>Принимающий стационар следует заранее информировать о транспортировке пациента с ИМпST.</li>
        </ul>`,`КР157_5: Приложение Б4, стр. 211.`)}

      ${card("2","Карта вызова и сопроводительный талон","Что обязательно зафиксировать",`
        <div class="checklist">
          ${["Время начала ОКС","Время первого медицинского контакта","Время регистрации ЭКГ","Проведённое лечение и дозы препаратов","Время доставки в стационар","Препараты, принятые за последние 24 ч: время и дозы, если известно"].map((x,i)=>`<label class="check"><input type="checkbox" data-check="${i}"><span>${x}</span></label>`).join("")}
        </div>`,`КР157_5: Приложение Б4, стр. 211.`)}

      <div class="notice danger"><strong>Осложнения:</strong> при ОСН, кардиогенном шоке, жизнеугрожающих нарушениях ритма/проводимости действовать по соответствующим разделам КР. Эти отдельные алгоритмы в версии 1.1 ещё не развернуты.</div>
    `;
  }

  function strategyTactics(){
    if(state.strategy==="pci"){
      return `<div class="notice info"><strong>Первичное ЧКВ:</strong> если от постановки диагноза до проведения проводника ожидается &lt;120 мин. Альтернативный догоспитальный ориентир: транспортировка ≤60 мин.</div>`;
    }
    if(state.strategy==="tlt"){
      return `<div class="notice warn"><strong>Фармакоинвазивная тактика:</strong> при невозможности своевременного первичного ЧКВ и симптомах ≤12 ч — начать ТЛТ как можно быстрее (≤10 мин от диагноза при отсутствии противопоказаний), затем транспортировать пациента. Эффективность оценить через 60–90 мин.</div>
      <div class="notice danger details">ST снизился &lt;50%, сохраняется боль, прогрессирует ишемия, возникает ОСН или жизнеугрожающая аритмия → срочная КГ/«спасающее» ЧКВ.</div>`;
    }
    return `<div class="notice danger"><strong>Без реперфузии:</strong> противопоказания к ТЛТ + недоступность своевременного первичного ЧКВ. Экстренная госпитализация всё равно обязательна, предпочтительно в ЧКВ-центр.</div>`;
  }

  function render(){
    applyPrefs();
    app.innerHTML = shell(state.screen==="protocol" ? protocolView() : home());
    telegramInit();
  }

  app.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if(!btn) return;

    if(btn.dataset.protocol){
      const p = D.protocols.find(x=>x.id===btn.dataset.protocol);
      if(!p || p.status!=="active"){
        alert("Этот протокол пока в разработке.");
        return;
      }
      state.protocol = btn.dataset.protocol;
      state.screen = "protocol";
      state.tab = "diag";
      window.scrollTo(0,0);
      render();
      return;
    }
    if(btn.dataset.nav){
      state.nav = btn.dataset.nav;
      state.screen = "home";
      render();
      return;
    }
    if(btn.dataset.tab){
      state.tab = btn.dataset.tab;
      window.scrollTo(0,0);
      render();
      return;
    }
    if(btn.dataset.mode){
      state.mode = btn.dataset.mode;
      render();
      return;
    }
    if(btn.dataset.strategy){
      state.strategy = btn.dataset.strategy;
      render();
      return;
    }
    if(btn.dataset.action==="back"){
      state.screen = "home";
      window.scrollTo(0,0);
      render();
      return;
    }
    if(btn.dataset.action==="toggle-mode"){
      state.mode = state.mode==="brief" ? "full" : "brief";
      render();
      return;
    }
    if(btn.dataset.action==="toggle-theme"){
      state.theme = state.theme==="dark" ? "light" : "dark";
      render();
      return;
    }
    if(btn.dataset.action==="favorite"){
      state.favorite = !state.favorite;
      localStorage.setItem("fav_stemi", state.favorite ? "1" : "0");
      render();
      return;
    }
  });

  app.addEventListener("input", e => {
    if(e.target.matches("[data-search-drugs]")){
      state.drugQuery = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const input = document.querySelector("[data-search-drugs]");
      input?.focus();
      try{input?.setSelectionRange(pos,pos)}catch(_){}
    }
  });

  render();
})();
