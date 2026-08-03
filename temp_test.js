const code = `\n      <button id="nav-${m.id}" class="nav-btn ${m.id === "dashboard" ? "active" : ""}" onclick="showPage('${m.id}')">\n        <span class="nav-icon">${m.icon}</span>\n        <span>${m.label}</span>\n      </button>\n    `;
console.log(code);
