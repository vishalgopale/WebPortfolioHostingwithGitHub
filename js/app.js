(() => {
  "use strict";

  const steps = [
    {
      title: "Launch an EC2 instance",
      eyebrow: "FOUNDATION · STEP 1",
      simple: "Think of EC2 as renting a computer in AWS. It will run Linux and host the website.",
      technical: "Technical: choose Amazon Linux 2023, a suitable instance size, a key pair and a subnet. A public IPv4 address is needed for direct public access.",
      command: "AWS Console → EC2 → Launch instance",
      status: "EC2 selected", flow: "Step 1: provision the host", active: ["nodeEc2"], routes: []
    },
    {
      title: "Check the security group",
      eyebrow: "NETWORK SECURITY · STEP 2",
      simple: "A security group is like a virtual firewall. It decides which inbound connections can reach the instance.",
      technical: "Technical: allow HTTP TCP/80 from the intended audience. Allow SSH TCP/22 only from your trusted IP, not from the entire internet. Outbound rules also affect responses.",
      command: "Inbound: HTTP TCP 80 · SSH TCP 22 from My IP",
      status: "Checking inbound rules", flow: "Step 2: allow only intended traffic", active: ["nodeSg"], routes: ["route-request"]
    },
    {
      title: "Connect to EC2",
      eyebrow: "ADMIN ACCESS · STEP 3",
      simple: "SSH gives an administrator an encrypted terminal session on the Linux server.",
      technical: "Technical: use EC2 Instance Connect where supported, or SSH with the correct private key and username (often ec2-user on Amazon Linux). Port 22 must be reachable from your trusted IP.",
      command: "ssh -i my-key.pem ec2-user@EC2_PUBLIC_IP",
      status: "SSH session simulated", flow: "Step 3: administrator connects securely", active: ["nodeEc2"], routes: []
    },
    {
      title: "Install NGINX",
      eyebrow: "WEB SERVER · STEP 4",
      simple: "NGINX is the software that listens for web requests and sends back the files that make up your page.",
      technical: "Technical: on Amazon Linux 2023, first confirm the NGINX package is available in configured repositories. Install with DNF, then inspect any package or repository errors if installation fails.",
      command: "sudo dnf install nginx -y",
      status: "Installing NGINX", flow: "Step 4: install the web server", active: ["nodeEc2", "nodeNginx"], routes: []
    },
    {
      title: "Start and enable NGINX",
      eyebrow: "SERVICE MANAGEMENT · STEP 5",
      simple: "Starting runs NGINX now. Enabling it makes the service start automatically when Linux boots.",
      technical: "Technical: systemd manages Linux services. Check the unit state and recent logs before testing HTTP. If the command fails, inspect the error instead of assuming the service is running.",
      command: "sudo systemctl enable --now nginx",
      status: "Service state check", flow: "Step 5: run the NGINX service", active: ["nodeNginx"], routes: []
    },
    {
      title: "Place the website files",
      eyebrow: "STATIC CONTENT · STEP 6",
      simple: "NGINX reads files from its document root. HTML provides structure, CSS controls styling, JavaScript adds interaction and images supply artwork.",
      technical: "Technical: the default document root on many Amazon Linux NGINX packages is /usr/share/nginx/html/. Confirm the active root in /etc/nginx/nginx.conf or included configuration files.",
      command: "sudo cp -r site-files/* /usr/share/nginx/html/",
      status: "Website files selected", flow: "Step 6: NGINX can read static assets", active: ["nodeFiles", "nodeNginx"], routes: ["route-files"]
    },
    {
      title: "The browser sends a request",
      eyebrow: "HTTP REQUEST · STEP 7",
      simple: "When someone enters the public IP in a browser, the browser asks the server for a page using HTTP on port 80.",
      technical: "Technical: DNS is not required when using an IP directly. The route, public IP, network ACLs, security group and host firewall must allow traffic to reach the listening service.",
      command: "Browser → http://EC2_PUBLIC_IP/",
      status: "HTTP request in transit", flow: "Step 7: browser requests the homepage", active: ["nodeBrowser", "nodeInternet", "nodeSg", "nodeEc2", "nodeNginx"], routes: ["route-request"], packets: ["packetRequest"]
    },
    {
      title: "NGINX returns the page",
      eyebrow: "HTTP RESPONSE · STEP 8",
      simple: "NGINX locates the requested file and sends a response. The browser reads HTML, applies CSS, runs JavaScript and loads image files.",
      technical: "Technical: a successful request commonly returns HTTP/1.1 200 OK. NGINX serves static assets; it does not automatically run server-side application code.",
      command: "curl -I http://localhost",
      status: "200 OK response simulated", flow: "Step 8: files return to the browser", active: ["nodeBrowser", "nodeNginx", "nodeFiles"], routes: ["route-files", "route-response"], packets: ["packetResponse", "packetFile"]
    },
    {
      title: "Troubleshoot the common failures",
      eyebrow: "OPERATIONS · STEP 9",
      simple: "If the site will not open, check the server, firewall rules, address and local response one by one. Change one thing at a time.",
      technical: "Technical: verify inbound TCP/80, SSH source restriction, instance state and public IPv4, NGINX service status, listening sockets, host firewall and curl output. Use logs to narrow the fault.",
      command: "sudo systemctl status nginx  ·  curl -I http://localhost",
      status: "Troubleshooting checklist", flow: "Step 9: isolate the failing layer", active: ["nodeSg", "nodeEc2", "nodeNginx"], routes: []
    }
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const navButtons = $$(".step-button");
  const playPauseButton = $("#playPause");
  const resetButton = $("#resetButton");
  const dialog = $("#infoDialog");
  let currentStep = 0;
  let playing = true;
  let timer = null;

  function renderStep(index) {
    currentStep = (index + steps.length) % steps.length;
    const step = steps[currentStep];
    navButtons.forEach((button, i) => {
      button.classList.toggle("active", i === currentStep);
      button.setAttribute("aria-current", i === currentStep ? "step" : "false");
    });
    $("#stepCounter").textContent = `${String(currentStep + 1).padStart(2, "0")} / 09`;
    $("#captionNumber").textContent = String(currentStep + 1).padStart(2, "0");
    $("#captionEyebrow").textContent = step.eyebrow;
    $("#captionTitle").textContent = step.title;
    $("#captionSimple").textContent = step.simple;
    $("#captionTechnical").textContent = step.technical;
    $("#captionCommand").textContent = step.command;
    $("#diagramStatus").textContent = step.status;
    $("#flowLabel").textContent = step.flow;

    $$(".node").forEach((node) => node.classList.toggle("active", step.active.includes(node.id)));
    $$(".route").forEach((route) => route.classList.toggle("active", step.routes.includes(route.id)));
    $$(".packet").forEach((packet) => packet.classList.toggle("moving", (step.packets || []).includes(packet.id)));

    const terminal = $("#terminalBody");
    if (currentStep === 2) {
      terminal.innerHTML = `<p><span class="prompt">$</span> ssh -i my-key.pem ec2-user@EC2_PUBLIC_IP</p><p class="terminal-success">[ec2-user@ip-10-0-1-25 ~]$ Connected (illustration)</p><p>Connection shown for learning; no real server is contacted.</p>`;
    } else if (currentStep === 3) {
      terminal.innerHTML = `<p><span class="prompt">$</span> sudo dnf install nginx -y</p><p class="terminal-success">Dependencies resolved. (example output)</p><p>Complete!</p>`;
    } else if (currentStep === 4) {
      terminal.innerHTML = `<p><span class="prompt">$</span> sudo systemctl enable --now nginx</p><p class="terminal-success">Created symlink for nginx.service (example)</p><p><span class="prompt">$</span> sudo systemctl is-active nginx</p><p class="terminal-success">active</p>`;
    } else if (currentStep === 5) {
      terminal.innerHTML = `<p><span class="prompt">$</span> ls -l /usr/share/nginx/html/</p><p>index.html &nbsp; css/ &nbsp; js/ &nbsp; assets/</p><p class="terminal-success">Static files are in the configured document root (example).</p>`;
    } else if (currentStep === 6) {
      terminal.innerHTML = `<p><span class="prompt">$</span> Browser: GET / HTTP/1.1</p><p>Host: EC2_PUBLIC_IP</p><p class="terminal-success">Request is being illustrated through the diagram.</p>`;
    } else if (currentStep === 7) {
      terminal.innerHTML = `<p><span class="prompt">$</span> curl -I http://localhost</p><p class="terminal-success">HTTP/1.1 200 OK</p><p>Server: nginx</p><p>Content-Type: text/html</p>`;
    } else if (currentStep === 8) {
      terminal.innerHTML = `<p><span class="prompt">$</span> sudo systemctl status nginx</p><p class="terminal-success">Check: active (running)</p><p><span class="prompt">$</span> curl -I http://localhost</p><p class="terminal-success">Check: HTTP response</p><p>Also verify: security group TCP/80, public IP, route and host firewall.</p>`;
    } else {
      terminal.innerHTML = `<p><span class="prompt">$</span> sudo systemctl status nginx</p><p class="terminal-success">● nginx.service - The nginx HTTP and reverse proxy server</p><p>   Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled)</p><p>   Active: <span class="terminal-success">active (running)</span></p><p><span class="prompt">$</span> curl -I http://localhost</p><p class="terminal-success">HTTP/1.1 200 OK</p><p>Server: nginx</p><p>Content-Type: text/html</p>`;
    }
  }

  function stopTimer() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  }
  function startTimer() {
    stopTimer();
    timer = window.setInterval(() => renderStep(currentStep + 1), 5000);
  }
  function setPlaying(value) {
    playing = value;
    playPauseButton.textContent = playing ? "Ⅱ Pause" : "▶ Play";
    playPauseButton.setAttribute("aria-pressed", String(!playing));
    if (playing) startTimer(); else stopTimer();
  }

  navButtons.forEach((button) => button.addEventListener("click", () => {
    renderStep(Number(button.dataset.step));
    if (playing) startTimer();
  }));
  playPauseButton.addEventListener("click", () => setPlaying(!playing));
  resetButton.addEventListener("click", () => {
    renderStep(0);
    setPlaying(false);
    $("#previewMessage").hidden = true;
  });
  $("#themeToggle").addEventListener("click", () => {
    const light = document.body.classList.toggle("light");
    $("#themeToggle").innerHTML = light ? "☾ <span>Theme</span>" : "☼ <span>Theme</span>";
    $("#themeToggle").setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    try { localStorage.setItem("nginx-server-visual-theme", light ? "light" : "dark"); } catch (_) { /* Storage may be unavailable on static previews. */ }
  });
  try {
    if (localStorage.getItem("nginx-server-visual-theme") === "light") {
      document.body.classList.add("light");
      $("#themeToggle").innerHTML = "☾ <span>Theme</span>";
    }
  } catch (_) { /* Theme still works for this session. */ }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const original = button.textContent;
      button.textContent = "Copied!";
      window.setTimeout(() => { button.textContent = original; }, 1400);
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "absolute";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      button.textContent = ok ? "Copied!" : "Select text";
      window.setTimeout(() => { button.textContent = "Copy"; }, 1400);
    }
  }
  $("#copyCommand").addEventListener("click", (event) => copyText($("#captionCommand").textContent, event.currentTarget));
  $("#copyInterview").addEventListener("click", (event) => {
    const answer = "A browser sends an HTTP request to the EC2 public IP on port 80. The security group permits the traffic, and NGINX listens on the instance, finds the requested static files and returns an HTTP response. The browser then renders HTML, applies CSS, runs JavaScript and loads images.";
    copyText(answer, event.currentTarget);
  });

  function showDialog(title, description) {
    $("#dialogTitle").textContent = title;
    $("#dialogText").textContent = description;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else window.alert(`${title}\n\n${description}`);
  }
  $("#previewPlay").addEventListener("click", () => showDialog("Preview action", "In a real streaming service, Play would open a video player. This educational project is a static landing-page mockup and does not stream video."));
  $("#moreInfo").addEventListener("click", () => showDialog("The Last Horizon", "A fictional sci-fi series created for this educational preview. It demonstrates the kind of hero content that static HTML and CSS can display."));
  $$(".poster-card").forEach((card) => card.addEventListener("click", () => showDialog(card.dataset.title, card.dataset.desc)));
  $("#closeDialog").addEventListener("click", () => dialog.close());
  $("#dialogOk").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  renderStep(0);
  setPlaying(true);
})();