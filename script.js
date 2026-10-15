// ---------- 1. Data ----------
const inventory = [
    { name: "Laptop", price: 800, stock: 52 },
    { name: "Mouse", price: 25, stock: 120 },
];
let activeCat = "All";

// ---------- 2. Conditionals ----------
function getCategory(price) {
    switch (true) {
        case price < 50: return "Budget";
        case price < 500: return "Standard";
        default: return "Premium";
    }
}
const stockStatus = (stock) => (stock < 50 ? "Low Stock" : "In Stock");

// ---------- 3. Loops with break / continue ----------
function findProduct(name) {
    for (const item of inventory) {
        if (item.name.toLowerCase() !== name.toLowerCase()) continue;
        return item;
    }
    return undefined;
}

function validateProduct(raw) {
    const errors = [];
    const name = raw.name.trim();

    // stop at the first missing field (break), skip fields that are fine (continue)
    for (const [label, value] of [["Name", name], ["Price", raw.price.trim()], ["Stock", raw.stock.trim()]]) {
        if (value !== "") continue;
        errors.push(`${label} is required.`);
        break;
    }
    if (errors.length) return { errors };

    const price = Number(raw.price);   // explicit conversion
    const stock = Number(raw.stock);
    if (Number.isNaN(price) || price <= 0) errors.push("Price must be a positive number.");
    else if (!Number.isInteger(stock) || stock < 0) errors.push("Stock must be a whole number (0 or more).");
    else if (findProduct(name)) errors.push(`${name} is already in the inventory.`);
    return { errors, item: errors.length ? null : { name, price, stock } };
}

// ---------- 4. Functions & scope ----------
function calculateTotal(items) {
    let total = 0;
    for (const item of items) total += item.price;
    return total;
}
const applyAdjustments = (tax, discount) => (price) => price * (1 - discount) * (1 + tax);

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
function showMsg(text, err = false) { $("msg").textContent = text; $("msg").className = "msg" + (err ? " err" : ""); }
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function svgEl(parent, tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    parent.append(e);
    return e;
}
const COLORS = { Budget: "#bcd2fb", Standard: "#2f6bf0", Premium: "#1a2fa8" };

// ---------- 5. Render ----------
function render() {
    inventory.forEach((i) => (i.category = getCategory(i.price)));

    const q = $("search").value.trim().toLowerCase();
    const visible = inventory
        .filter((i) => activeCat === "All" || i.category === activeCat)
        .filter((i) => i.name.toLowerCase().includes(q));
    const rows = $("rows"); rows.innerHTML = "";
    if (visible.length === 0) {
        const tr = el("tr"); const td = el("td", "", "No products match."); td.colSpan = 5; tr.append(td); rows.append(tr);
    }
    const cell = (label, cls, text) => { const td = el("td", cls, text); td.dataset.label = label; return td; };
    visible.forEach((i) => {
        const tr = el("tr");
        const nm = cell("Product", "nm"); nm.append(el("span", "thumb"), document.createTextNode(i.name));
        const st = cell("Status"); const low = i.stock < 50;
        st.append(el("span", "pill " + (low ? "low" : "ok"), stockStatus(i.stock)));
        tr.append(nm, cell("Category", i.category, i.category), cell("Price", "", `$${i.price}`), cell("Stock", "", String(i.stock)), st);
        rows.append(tr);
    });

    const total = calculateTotal(inventory);
    $("total").textContent = `$${total}`;
    const adj = applyAdjustments(Number($("tax").value) / 100, Number($("discount").value) / 100);
    $("adjusted").textContent = `$${adj(total).toFixed(2)} after discount and tax`;

    const affordable = inventory.filter((i) => i.price < 200).map((i) => i.name);
    $("affordable").innerHTML = "";
    affordable.forEach((n) => $("affordable").append(el("span", "chip", n)));

    const report = inventory.map((i) => `${i.name.toUpperCase()}: $${i.price}`);
    $("report").innerHTML = "";
    report.forEach((l) => $("report").append(el("code", "", l)));

    drawDonut();
    drawLine();

    console.clear();
    console.log("--- Processing Inventory Roster (forEach) ---");
    inventory.forEach((i) => console.log(`* Item: ${i.name} ($${i.price}) -> Category: ${i.category}`));
    console.log("\n--- Financial Analytics ---");
    console.log(`Total Inventory Value: $${total}`);
    console.log("Filtered Affordable Items (Under $200):", affordable);
    console.log("Formatted Report List:", report);
}

// ---------- Charts ----------
function drawDonut() {
    const svg = $("donut"); svg.innerHTML = ""; $("legend").innerHTML = "";
    const cats = ["Budget", "Standard", "Premium"];
    const counts = cats.map((c) => inventory.filter((i) => i.category === c).length);
    const n = inventory.length, C = 2 * Math.PI * 38;
    let offset = 0;
    cats.forEach((c, k) => {
        if (counts[k] > 0) {
            const len = (counts[k] / n) * C;
            svgEl(svg, "circle", {
                cx: 50, cy: 50, r: 38, fill: "none", stroke: COLORS[c], "stroke-width": 16,
                "stroke-dasharray": `${Math.max(len - 1.5, 0)} ${C}`, "stroke-dashoffset": -offset,
                transform: "rotate(-90 50 50)",
            });
            offset += len;
        }
        const li = el("div"); const d = el("span", "dot"); d.style.background = COLORS[c];
        li.append(d, document.createTextNode(`${c}: ${counts[k]}`)); $("legend").append(li);
    });
    svgEl(svg, "text", { x: 50, y: 50, "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: "#111827" }, n);
    svgEl(svg, "text", { x: 50, y: 63, "text-anchor": "middle", "font-size": 7, fill: "#8a93a0" }, "products");
}

function drawLine() {
    const svg = $("line"); svg.innerHTML = "";
    const W = Math.max(Math.round(svg.getBoundingClientRect().width) || 600, 240);
    const H = W < 480 ? 180 : 230;
    const padX = 34, padTop = 34, padBottom = 34;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("height", H);

    const max = Math.max(...inventory.map((i) => i.price), 1);
    const base = H - padBottom;
    const n = inventory.length;
    const pts = inventory.map((i, k) => [
        n === 1 ? W / 2 : padX + (k * (W - padX * 2)) / (n - 1),
        base - (i.price / max) * (base - padTop),
    ]);

    // gridlines
    [0, 0.5, 1].forEach((f) => {
        const y = base - f * (base - padTop);
        svgEl(svg, "line", { x1: padX / 2, x2: W - padX / 2, y1: y, y2: y, stroke: "#e8ebf0", "stroke-dasharray": f === 0 ? "" : "3 4" });
    });

    // smooth line + area
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let k = 1; k < n; k++) {
        const mx = (pts[k - 1][0] + pts[k][0]) / 2;
        d += ` C ${mx} ${pts[k - 1][1]}, ${mx} ${pts[k][1]}, ${pts[k][0]} ${pts[k][1]}`;
    }
    if (n > 1) {
        svgEl(svg, "path", { d: `${d} L ${pts[n - 1][0]} ${base} L ${pts[0][0]} ${base} Z`, fill: "#2f5bea", "fill-opacity": 0.1 });
        svgEl(svg, "path", { d, fill: "none", stroke: "#2f5bea", "stroke-width": 3, "stroke-linecap": "round" });
    }

    // points + labels (skip some name labels if crowded)
    const spacing = n > 1 ? (W - padX * 2) / (n - 1) : W;
    const step = Math.max(1, Math.ceil(70 / spacing));
    pts.forEach((p, k) => {
        svgEl(svg, "circle", { cx: p[0], cy: p[1], r: 5, fill: "#fff", stroke: "#2f5bea", "stroke-width": 3 });
        if (k % step !== 0) return;
        const nm = inventory[k].name;
        svgEl(svg, "text", { x: p[0], y: H - 10, "text-anchor": "middle", "font-size": 11, fill: "#8a93a0" }, nm.length > 9 ? nm.slice(0, 8) + "…" : nm);
        svgEl(svg, "text", { x: p[0], y: p[1] - 12, "text-anchor": "middle", "font-size": 11, "font-weight": 600, fill: "#111827" }, `$${inventory[k].price}`);
    });
}

// redraw the line chart when the screen size changes
let resizeTimer;
window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(drawLine);
});

// ---------- Add product form ----------
const dlg = $("dlg");
function openDialog() {
    $("addForm").reset();
    $("formErr").textContent = "";
    $("preview").textContent = "Category: -";
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    $("fName").focus();
}
function closeDialog() {
    if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
}

$("addBtn").addEventListener("click", () => { showMsg(""); openDialog(); });
$("cancelBtn").addEventListener("click", closeDialog);
dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDialog(); }); // backdrop click

$("fPrice").addEventListener("input", () => {
    const p = Number($("fPrice").value);
    $("preview").textContent = $("fPrice").value !== "" && p > 0 ? `Category: ${getCategory(p)}` : "Category: -";
});

$("addForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const { errors, item } = validateProduct({ name: $("fName").value, price: $("fPrice").value, stock: $("fStock").value });
    if (errors.length) { $("formErr").textContent = errors[0]; return; }
    inventory.push(item);
    closeDialog();
    showMsg(`Added ${item.name} at $${item.price}.`);
    render();
    console.log(`[User adds "${item.name}" at "$${item.price}"]`);
});

// ---------- Tabs, search, tax/discount ----------
$("tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    activeCat = b.dataset.cat;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t === b));
    render();
});
["search", "tax", "discount"].forEach((id) => $(id).addEventListener("input", render));

console.log("--- Initializing Inventory System ---");
render();