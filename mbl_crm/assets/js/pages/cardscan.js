/* Scan Business Card — photo → OCR/AI extract → dedup → merge/create.
   Real extraction: Claude vision when Supabase is connected, on-device
   OCR (Tesseract) otherwise. Nothing is invented. Upload is cancellable. */
PAGES.cardscan = {
  icon: "📇", title: () => I18N.t("cardscan"),
  render(view) {
    const t = I18N.t.bind(I18N), h = U.h;
    let scanGen = 0; // bumped on every new file / cancel; stale results are ignored

    view.appendChild(h("div", { class: "banner banner--info" }, [h("span", {}, "✨"), h("div", { class: "small" }, t("scanIntro"))]));

    const fileInput = h("input", { type: "file", accept: "image/*", capture: "environment", style: "display:none",
      onChange: (e) => { if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]); } });

    const drop = h("div", { class: "dropzone" }, [
      h("div", { class: "big" }, "📷"),
      h("div", {}, t("dropHere")),
      h("div", { class: "muted small", style: "margin-top:6px" }, t("takePhoto")),
    ]);
    drop.addEventListener("click", () => fileInput.click());
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });

    const previewHost = h("div", {});
    const resultHost = h("div", {});
    const grid = h("div", { class: "scan-grid" }, [h("div", {}, [drop, fileInput, previewHost]), resultHost]);
    view.appendChild(grid);

    function idleNote() {
      resultHost.innerHTML = "";
      const msg = AI.connected ? null : h("div", { class: "banner", style: "margin:0" }, [h("span", {}, "ℹ️"), h("div", { class: "small" }, t("ocrNote"))]);
      if (msg) resultHost.appendChild(msg);
    }

    function reset() {
      scanGen++;               // invalidate any in-flight scan
      fileInput.value = "";
      previewHost.innerHTML = "";
      idleNote();
    }

    idleNote();

    function handleFile(file) {
      const gen = ++scanGen;
      const reader = new FileReader();
      reader.onload = () => {
        if (gen !== scanGen) return;
        const dataUrl = reader.result;
        previewHost.innerHTML = "";
        previewHost.appendChild(h("img", { class: "card-preview", src: dataUrl, alt: "card" }));
        previewHost.appendChild(h("button", { class: "btn btn--sm", style: "margin-top:8px", onClick: reset }, "✕ " + t("cancelScan")));

        const prog = h("span", { class: "muted" }, t("analyzing"));
        resultHost.innerHTML = "";
        resultHost.appendChild(h("div", { style: "display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:16px 0" }, [
          h("span", { class: "spinner" }), prog,
          h("button", { class: "btn btn--sm", onClick: reset }, "✕ " + t("cancelScan")),
        ]));

        AI.scanCard(dataUrl, { onProgress: (p) => { if (gen === scanGen) prog.textContent = t("analyzing") + " " + Math.round(p * 100) + "%"; } })
          .then((fields) => { if (gen === scanGen) showReview(fields, dataUrl); })
          .catch((e) => {
            if (gen !== scanGen) return;
            resultHost.innerHTML = "";
            const unavailable = /unavailable/i.test(String(e && e.message));
            resultHost.appendChild(h("div", { class: unavailable ? "banner" : "banner banner--allergen" }, [
              h("span", {}, unavailable ? "ℹ️" : "⚠️"),
              h("div", { class: "small" }, unavailable ? t("ocrUnavailable") : String(e && e.message || e)),
            ]));
            // still let them create a contact by hand
            showReview({ _engine: "manual" }, dataUrl);
          });
      };
      reader.readAsDataURL(file);
    }

    function showReview(fields, dataUrl) {
      resultHost.innerHTML = "";
      const engine = fields._engine || "manual";
      const dup = engine === "manual" ? null : Data.findDuplicate(fields);

      const head = h("div", { class: "section-head" }, [h("h2", {}, t("reviewExtracted"))]);
      if (engine === "ai") head.appendChild(h("span", { class: "ai-badge" }, "AI"));
      else if (engine === "ocr") head.appendChild(h("span", { class: "badge" }, "OCR"));
      resultHost.appendChild(head);
      resultHost.appendChild(h("div", { class: "muted small", style: "margin:-8px 0 12px" },
        engine === "ai" ? t("extractedBy") : engine === "ocr" ? t("ocrNote") : t("enterManually")));

      let mode = "new";
      const dupBox = h("div", {});
      if (dup) {
        const existing = dup.contact;
        const mergeBtn = h("button", { class: "btn btn--sm btn--primary", onClick: () => { mode = "merge"; mark(); } }, t("merge") + " · " + Data.contactName(existing));
        const newBtn = h("button", { class: "btn btn--sm", onClick: () => { mode = "new"; mark(); } }, t("createNew"));
        function mark() { mergeBtn.classList.toggle("btn--primary", mode === "merge"); newBtn.classList.toggle("btn--primary", mode === "new"); }
        dupBox.appendChild(h("div", { class: "dup-warn" }, [
          h("b", {}, "⚠️ " + t("duplicateFound")),
          h("div", { class: "small", style: "margin:6px 0 10px" }, t("mergeQ")),
          h("div", { style: "display:flex;gap:8px;flex-wrap:wrap" }, [mergeBtn, newBtn]),
        ]));
        mark();
      }
      resultHost.appendChild(dupBox);

      const F = {};
      const inp = (name, label) => { const el = h("input", { class: "input", value: fields[name] || "" }); F[name] = el; return h("div", { class: "field" }, [h("label", {}, label), el]); };
      const form = h("div", {}, [
        h("div", { class: "row" }, [inp("first_name", t("firstName")), inp("last_name", t("lastName"))]),
        inp("full_name", t("fullName")),
        h("div", { class: "row" }, [inp("job_title", t("jobTitle")), inp("company_name", t("company"))]),
        h("div", { class: "row" }, [inp("email_work", t("emailWork")), inp("phone_mobile", t("phoneMobile"))]),
        h("div", { class: "row" }, [inp("phone_work", t("phoneWork")), inp("website", t("website"))]),
        h("div", { class: "row" }, [inp("line", t("line")), inp("whatsapp", t("whatsapp")), inp("wechat", t("wechat"))]),
        inp("linkedin", t("linkedin")),
        inp("address_work", t("addressWork")),
        h("div", { class: "row" }, [inp("city", t("city")), inp("country", t("country"))]),
        inp("where_met", t("whereMet")),
      ]);
      resultHost.appendChild(form);

      const saveBtn = h("button", { class: "btn btn--primary", onClick: doSave }, "💾 " + t("saveContact"));
      const againBtn = h("button", { class: "btn", onClick: () => { reset(); fileInput.click(); } }, "📷 " + t("scanAnother"));
      const cancelBtn = h("button", { class: "btn btn--danger", onClick: reset }, "✕ " + t("discardScan"));
      resultHost.appendChild(h("div", { style: "display:flex;gap:8px;margin-top:14px;flex-wrap:wrap" }, [saveBtn, againBtn, cancelBtn]));

      async function doSave() {
        saveBtn.disabled = true;
        const vals = {}; Object.keys(F).forEach((k) => { vals[k] = (F[k].value || "").trim(); });
        if (!vals.full_name) vals.full_name = [vals.first_name, vals.last_name].filter(Boolean).join(" ").trim();
        if (!vals.full_name) { U.toast(t("fullName") + "?", true); saveBtn.disabled = false; return; }
        const companyId = vals.company_name ? await Data.ensureCompany(vals.company_name) : null;
        const contactFields = {
          first_name: vals.first_name || null, last_name: vals.last_name || null, full_name: vals.full_name,
          job_title: vals.job_title || null, company_id: companyId,
          email_work: vals.email_work || null, phone_mobile: vals.phone_mobile || null, phone_work: vals.phone_work || null,
          website: vals.website || null, line: vals.line || null, whatsapp: vals.whatsapp || null, wechat: vals.wechat || null,
          linkedin: vals.linkedin || null, address_work: vals.address_work || null, city: vals.city || null, country: vals.country || null,
          where_met: vals.where_met || null,
        };
        if (dup && mode === "merge") {
          const existing = dup.contact, patch = {};
          Object.keys(contactFields).forEach((k) => { if (contactFields[k] && !existing[k]) patch[k] = contactFields[k]; });
          patch.last_contacted = U.TODAY;
          await Data.update("contacts", existing.id, patch);
          await Data.logActivity(existing.id, "card", "Business card scanned & merged.");
          U.toast(t("saved")); Router.go("#/contacts/" + existing.id);
        } else {
          const created = await Data.create("contacts", Object.assign({ status: "lead", rating: "medium", tags: [], owner: "Michel", source: "Business card" }, contactFields));
          await Data.logActivity(created.id, "card", "Added from business card.");
          U.toast(t("saved")); Router.go("#/contacts/" + created.id);
        }
      }
    }
  },
};
