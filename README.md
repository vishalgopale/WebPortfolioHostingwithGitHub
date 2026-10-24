# Nginx Server visual

**An interactive, beginner-friendly AWS + NGINX learning project**  
Branding: **#Buildwithvinit**

> This is an independent educational project. Its fictional streaming interface is inspired by common streaming-service layouts, but it is not affiliated with Netflix and does not use Netflix source code, logos, or branded artwork.

## What you will learn

- What an AWS EC2 instance does
- How a security group filters inbound traffic
- Why SSH (TCP/22) and HTTP (TCP/80) are different
- How NGINX serves static HTML, CSS, JavaScript and image files
- How an HTTP request and response move through the system
- Basic service and HTTP troubleshooting
- How to publish a static learning project with GitHub Pages

## Features

- Nine selectable learning steps
- Five-second autoplay, Pause and Reset
- Animated SVG infrastructure diagram
- Request, response and file-flow animation
- Interactive fictional streaming-style landing page
- Dark/light theme toggle
- Copyable commands and an interview-ready explanation
- Responsive layout and reduced-motion support
- No build step, package manager or framework required

## Project structure

```text
Nginx Server visual/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── assets/
├── .nojekyll
├── LICENSE
└── README.md
```

The `assets/` directory is reserved for locally licensed artwork if you choose to add it. The preview currently uses image URLs from Unsplash; an internet connection is required for those remote photos and Google Fonts. You may replace them with locally stored artwork that you have permission to use.

## Run locally

1. Download and unzip the project.
2. Open `index.html` in a modern browser.
3. For a local HTTP preview, run Python from the project directory:

   ```bash
   python -m http.server 8000
   ```

4. Visit `http://localhost:8000`.

No compile or build command is needed.

## Publish using GitHub Pages

1. Create a repository on GitHub, for example `nginx-server-visual`.
2. Upload the contents of this project so `index.html` is at the repository root (not hidden one folder deeper).
3. Open the repository **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then click **Save**.
6. Wait for GitHub Pages to finish publishing.
7. Open the URL shown on the Pages settings screen. It usually resembles `https://YOUR-USERNAME.github.io/nginx-server-visual/`.

GitHub Pages hosts the static learning visual. It does **not** launch an AWS EC2 server or run NGINX. Use the EC2 deployment section below if you want to practice a real NGINX web server.

### Git command option

Run these commands in the extracted project folder after creating an empty GitHub repository:

```bash
git init
git add .
git commit -m "Add Nginx Server visual project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/nginx-server-visual.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. If GitHub requests authentication, use an approved method such as Git Credential Manager or a personal access token; your account password is not accepted for Git HTTPS authentication.

## Deploy a real static site on AWS EC2 (Amazon Linux 2023)

> AWS charges may apply. Check your account's current Free Tier/Free Plan eligibility, instance pricing, public IPv4 pricing and other charges before launching resources. Stop or terminate resources when you no longer need them.

### 1. Launch the instance

- Open AWS Console → EC2 → Launch instance.
- Choose **Amazon Linux 2023**.
- Choose an instance size appropriate for your account and practice workload.
- Configure a key pair or EC2 Instance Connect if supported.
- Use a public subnet and public IPv4 address for direct internet access.
- Configure the security group:
  - SSH TCP/22: **My IP** only (or another tightly controlled trusted source).
  - HTTP TCP/80: `0.0.0.0/0` for a public demo. For private testing, restrict the source.
- Review your configuration and launch the instance.

A security group is stateful, but subnet routes, network ACLs and host firewall settings can still affect connectivity.

### 2. Connect to EC2

Using SSH from a terminal on your computer:

```bash
chmod 400 my-key.pem
ssh -i my-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

Replace the key filename and public IP. You may also use EC2 Instance Connect when available. Do not upload private keys to GitHub.

### 3. Install and start NGINX

On Amazon Linux 2023, package availability can depend on configured repositories. Try:

```bash
sudo dnf update -y
sudo dnf install nginx -y
sudo systemctl enable --now nginx
sudo systemctl status nginx
```

If `dnf` cannot find the NGINX package, inspect the error and configured repositories rather than assuming installation succeeded. Repository configuration may differ by AMI and region.

### 4. Copy the site files to the document root

From your local machine, run the following command from the extracted project directory. It copies the website files to your instance:

```bash
scp -i my-key.pem -r index.html css js ec2-user@YOUR_EC2_PUBLIC_IP:/home/ec2-user/
```

Then SSH into EC2 and install the files into the NGINX document root:

```bash
sudo mkdir -p /usr/share/nginx/html/css /usr/share/nginx/html/js
sudo cp /home/ec2-user/index.html /usr/share/nginx/html/
sudo cp -r /home/ec2-user/css/. /usr/share/nginx/html/css/
sudo cp -r /home/ec2-user/js/. /usr/share/nginx/html/js/
```

The demo references remote Unsplash photos and Google Fonts, so those elements require internet access from the viewer's browser. For a fully self-contained version, store properly licensed assets locally and update the references.

### 5. Verify

On the EC2 instance:

```bash
curl -I http://localhost
sudo systemctl is-active nginx
sudo ss -lntp | grep ':80'
```

Then open this in your browser:

```text
http://YOUR_EC2_PUBLIC_IP/
```

If it does not load, check the public IPv4 address, instance state, subnet route to an internet gateway, inbound TCP/80 security-group rule, network ACLs, host firewall, NGINX status and logs.

### 6. Useful troubleshooting commands

```bash
sudo systemctl status nginx
sudo journalctl -u nginx --no-pager -n 50
sudo nginx -t
sudo ss -lntp | grep ':80'
curl -I http://localhost
curl -v http://YOUR_EC2_PUBLIC_IP/
```

Interpretation:
- `curl -I http://localhost` succeeds, but the public page fails: investigate the public route, security group, network ACL, host firewall and public IP.
- NGINX is inactive: inspect `systemctl status` and `journalctl`, then start the service if appropriate.
- `nginx -t` fails: fix the reported configuration syntax or referenced-file issue before reloading.
- HTTP 403: inspect file permissions and NGINX configuration.
- HTTP 404: check the requested path and document root.
- Connection refused: check whether NGINX is listening on port 80.
- Timeout: investigate network reachability and firewall rules.

## Nine-step concept map

1. **AWS EC2** — provision a Linux host.
2. **Security Group** — permit intended inbound traffic.
3. **Connect to EC2** — establish a secure administrator session.
4. **Install NGINX** — install web-server software.
5. **Start NGINX** — manage the service with systemd.
6. **Website Files** — put static files in the document root.
7. **Browser Request** — browser requests the page over HTTP.
8. **NGINX Response** — server returns the page and assets.
9. **Troubleshooting** — isolate problems layer by layer.

## Interview answer (beginner-friendly)

“A visitor enters the EC2 public IP in a browser. The browser sends an HTTP request to port 80. The EC2 security group must allow that traffic, and the network route must reach the instance. NGINX listens on the server, locates the requested static files and returns an HTTP response. The browser renders the HTML, applies CSS, runs JavaScript and loads the images. If the page fails, I check the security group, public IP and route, NGINX service status, listening port, logs and `curl http://localhost`.”

## Visual assets and licensing

The interface uses original project code and fictional titles. Remote photographic images are loaded from Unsplash image CDN URLs. Review the applicable Unsplash license and each asset's terms before redistribution or commercial use. To avoid external dependencies, replace remote image URLs with local assets you have permission to distribute.

## Disclaimer

This project is a visual simulation. The animated diagram, terminal output and homepage preview do not connect to AWS, execute shell commands, stream video or prove that a server is running. Commands in this README are examples to run in your own environment after reviewing security and cost implications.

## License

MIT — see [`LICENSE`](LICENSE).
