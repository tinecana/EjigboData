function runGlobalSearch(value){
  value = String(value || "").toLowerCase().trim();
  if(!value) return;

  const members = allMembers().filter(m =>
    `${m.name} ${m.phone} ${m.street} ${m.unitNum} ${m.membershipNumber}`.toLowerCase().includes(value)
  ).slice(0,8);

  if(value.length >= 3){
    openModal(
      "Universal Search",
      members.length
        ? `<div class="grid">${members.map(m=>`
            <button class="btn btn-outline" style="justify-content:flex-start" onclick="closeModal();openMemberProfile('${escapeHtml(m.id || m.qrId)}')">
              ${escapeHtml(m.name || "Unnamed")} · ${escapeHtml(m.phone || "")} · Unit ${escapeHtml(m.unitNum)}
            </button>
          `).join("")}</div>`
        : `<p class="muted">No matching member found.</p>`,
      `<button class="btn btn-primary" onclick="closeModal()">Close</button>`
    );
    document.getElementById("globalSearch").value = "";
  }
}
