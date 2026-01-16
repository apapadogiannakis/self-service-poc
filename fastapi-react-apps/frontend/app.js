async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return await res.json();
}

function parseUiRouteFromLocation() {
  try {
    const path = window.location.pathname || "/";
    const params = new URLSearchParams(window.location.search || "");
    const env = params.get("env") || "";

    const m = path.match(/^\/apps(?:\/([^/]+)(?:\/(namespaces|l4_ingress))?)?\/?$/);
    if (!m) return { env, view: "apps", appname: "" };

    const appname = m[1] ? decodeURIComponent(m[1]) : "";
    const tail = m[2] || "";
    if (tail === "namespaces") return { env, view: "namespaces", appname };
    if (tail === "l4_ingress") return { env, view: "l4ingress", appname };
    return { env, view: "apps", appname: "" };
  } catch {
    return { env: "", view: "apps", appname: "" };
  }
}

function buildUiUrl({ view, env, appname }) {
  const q = env ? `?env=${encodeURIComponent(env)}` : "";
  if (view === "namespaces" && appname) return `/apps/${encodeURIComponent(appname)}/namespaces${q}`;
  if (view === "l4ingress" && appname) return `/apps/${encodeURIComponent(appname)}/l4_ingress${q}`;
  return `/apps${q}`;
}

function pushUiUrl(next, replace = false) {
  const url = buildUiUrl(next);
  const state = { view: next.view, env: next.env || "", appname: next.appname || "" };
  if (replace) window.history.replaceState(state, "", url);
  else window.history.pushState(state, "", url);
}

function uniqStrings(items) {
  const seen = new Set();
  const out = [];
  for (const v of items) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function App() {
  const [deployment, setDeployment] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState("");
  const [envKeys, setEnvKeys] = React.useState([]);
  const [activeEnv, setActiveEnv] = React.useState("");

  const [apps, setApps] = React.useState({});
  const [l4IpsByApp, setL4IpsByApp] = React.useState({});
  const [clustersByApp, setClustersByApp] = React.useState({});
  const [selectedApps, setSelectedApps] = React.useState(() => new Set());
  const [selectedNamespaces, setSelectedNamespaces] = React.useState(() => new Set());
  const [view, setView] = React.useState("apps");
  const [detailAppName, setDetailAppName] = React.useState("");
  const [namespaces, setNamespaces] = React.useState({});
  const [l4IngressItems, setL4IngressItems] = React.useState([]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [pendingRoute, setPendingRoute] = React.useState(() => parseUiRouteFromLocation());

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [deploymentType, user, envList] = await Promise.all([
          fetchJson("/api/deployment_type"),
          fetchJson("/api/current-user"),
          fetchJson("/api/envlist"),
        ]);

        if (cancelled) return;

        setDeployment(deploymentType);
        setCurrentUser(user.user || "");

        const keys = Object.keys(envList);
        setEnvKeys(keys);
        const first = keys[0] || "";
        const initial = parseUiRouteFromLocation();
        const initialEnv = keys.includes(initial.env) ? initial.env : first;
        setPendingRoute(initial);
        setActiveEnv(initialEnv);
        pushUiUrl({ view: initial.view, env: initialEnv, appname: initial.appname }, true);
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!activeEnv) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const appsResp = await fetchJson(`/api/apps?env=${encodeURIComponent(activeEnv)}`);
        if (cancelled) return;

        setApps(appsResp);
        const nextClusters = {};
        for (const [appname, app] of Object.entries(appsResp || {})) {
          nextClusters[appname] = Array.isArray(app?.clusters) ? app.clusters.map(String) : [];
        }
        setClustersByApp(nextClusters);
        setSelectedApps(new Set());
        setView("apps");
        setDetailAppName("");
        setNamespaces({});
        setL4IngressItems([]);

        const appNames = Object.keys(appsResp);

        const l4Pairs = await Promise.all(
          appNames.map(async (appname) => {
            const items = await fetchJson(
              `/api/apps/${encodeURIComponent(appname)}/l4_ingress?env=${encodeURIComponent(activeEnv)}`,
            );
            const ips = uniqStrings((items || []).flatMap((i) => i.allocated_ips || []));
            return [appname, ips];
          }),
        );

        if (cancelled) return;

        const next = {};
        for (const [appname, ips] of l4Pairs) next[appname] = ips;
        setL4IpsByApp(next);

        const pr = pendingRoute;
        if (pr && (pr.env || "").toUpperCase() === (activeEnv || "").toUpperCase()) {
          if (pr.view === "namespaces" && pr.appname) {
            setPendingRoute({ env: activeEnv, view: "apps", appname: "" });
            await openNamespaces(pr.appname, false);
          } else if (pr.view === "l4ingress" && pr.appname) {
            setPendingRoute({ env: activeEnv, view: "apps", appname: "" });
            await openL4Ingress(pr.appname, false);
          } else {
            setPendingRoute({ env: activeEnv, view: "apps", appname: "" });
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeEnv]);

  const deploymentEnv = deployment?.deployment_env || "";
  const bannerTitle = deployment?.title?.[deploymentEnv] || "OCP App Provisioning Portal";
  const bannerColor = deployment?.headerColor?.[deploymentEnv] || "#384454";

  const appRows = Object.keys(apps).map((k) => apps[k]);

  function requireExactlyOneSelectedApp() {
    const selected = Array.from(selectedApps);
    if (selected.length !== 1) {
      setError("Select exactly one application.");
      return null;
    }
    return selected[0];
  }

  function getDetailOrSelectedApp() {
    if (detailAppName) return detailAppName;
    return requireExactlyOneSelectedApp();
  }

  async function openNamespaces(appname, push = true) {
    if (!appname) return;
    try {
      setLoading(true);
      setError("");
      const resp = await fetchJson(
        `/api/apps/${encodeURIComponent(appname)}/namespaces?env=${encodeURIComponent(activeEnv)}`,
      );
      setDetailAppName(appname);
      setNamespaces(resp || {});
      setL4IngressItems([]);
      setSelectedNamespaces(new Set());
      setView("namespaces");
      if (push) pushUiUrl({ view: "namespaces", env: activeEnv, appname }, false);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function openL4Ingress(appname, push = true) {
    if (!appname) return;
    try {
      setLoading(true);
      setError("");
      const items = await fetchJson(
        `/api/apps/${encodeURIComponent(appname)}/l4_ingress?env=${encodeURIComponent(activeEnv)}`,
      );
      setDetailAppName(appname);
      setL4IngressItems(items || []);
      setNamespaces({});
      setView("l4ingress");
      if (push) pushUiUrl({ view: "l4ingress", env: activeEnv, appname }, false);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onViewNamespaces() {
    const appname = getDetailOrSelectedApp();
    if (!appname) return;
    await openNamespaces(appname, true);
  }

  function onBackToApps() {
    setView("apps");
    setDetailAppName("");
    setNamespaces({});
    setL4IngressItems([]);
    setSelectedNamespaces(new Set());
    setError("");
    pushUiUrl({ view: "apps", env: activeEnv, appname: "" }, false);
  }

  function onSelectAllFromFiltered(checked, appnames) {
    if (checked) setSelectedApps(new Set(appnames));
    else setSelectedApps(new Set());
  }

  async function onViewL4Ingress() {
    const appname = getDetailOrSelectedApp();
    if (!appname) return;
    await openL4Ingress(appname, true);
  }

  React.useEffect(() => {
    function onPopState() {
      const r = parseUiRouteFromLocation();
      setPendingRoute(r);
      if (r.env) setActiveEnv(r.env);
      else if (envKeys.length > 0 && !activeEnv) setActiveEnv(envKeys[0]);
      if (r.view === "apps") {
        setView("apps");
        setDetailAppName("");
        setNamespaces({});
        setL4IngressItems([]);
      }
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [envKeys, activeEnv]);

  function toggleSelectAll(checked) {
    if (checked) {
      setSelectedApps(new Set(appRows.map((a) => a.appname)));
    } else {
      setSelectedApps(new Set());
    }
  }

  function toggleRow(appname, checked) {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (checked) next.add(appname);
      else next.delete(appname);
      return next;
    });
  }

  function toggleNamespace(namespace, checked) {
    setSelectedNamespaces((prev) => {
      const next = new Set(prev);
      if (checked) next.add(namespace);
      else next.delete(namespace);
      return next;
    });
  }

  function onSelectAllNamespaces(checked, namespaceNames) {
    if (checked) setSelectedNamespaces(new Set(namespaceNames));
    else setSelectedNamespaces(new Set());
  }

  async function deleteSelectedNamespaces() {
    const selected = Array.from(selectedNamespaces);
    if (selected.length === 0) {
      setError("Please select at least one namespace to delete.");
      return;
    }

    const appname = detailAppName;
    if (!appname) {
      setError("No application selected.");
      return;
    }

    const confirmMsg = `Are you sure you want to delete ${selected.length} namespace(s) from ${appname}?\n\nNamespaces: ${selected.join(", ")}\n\nThis action cannot be undone.`;
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const namespacesParam = selected.join(",");
      const response = await fetch(
        `/api/apps/${encodeURIComponent(appname)}/namespaces?env=${encodeURIComponent(activeEnv)}&namespaces=${encodeURIComponent(namespacesParam)}`,
        { method: "DELETE", headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to delete namespaces: ${response.status} ${text}`);
      }

      await response.json();

      // Refresh the namespaces list
      const resp = await fetchJson(
        `/api/apps/${encodeURIComponent(appname)}/namespaces?env=${encodeURIComponent(activeEnv)}`,
      );
      setNamespaces(resp || {});
      setSelectedNamespaces(new Set());

      // Refresh apps list to update totalns count
      const appsResp = await fetchJson(`/api/apps?env=${encodeURIComponent(activeEnv)}`);
      setApps(appsResp);

      const nextClusters = {};
      for (const [appname, app] of Object.entries(appsResp || {})) {
        nextClusters[appname] = Array.isArray(app?.clusters) ? app.clusters.map(String) : [];
      }
      setClustersByApp(nextClusters);

      setError("");
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function deleteSelectedApps() {
    const selected = Array.from(selectedApps);
    if (selected.length === 0) {
      setError("Please select at least one application to delete.");
      return;
    }

    const confirmMsg = `Are you sure you want to delete ${selected.length} app(s)?\n\nApps: ${selected.join(", ")}\n\nThis will remove all associated namespaces, L4 ingress IPs, and pull requests.`;
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const deletePromises = selected.map(async (appname) => {
        const response = await fetch(
          `/api/apps/${encodeURIComponent(appname)}?env=${encodeURIComponent(activeEnv)}`,
          { method: "DELETE", headers: { Accept: "application/json" } }
        );
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to delete ${appname}: ${response.status} ${text}`);
        }
        return await response.json();
      });

      await Promise.all(deletePromises);

      // Refresh the apps list
      const appsResp = await fetchJson(`/api/apps?env=${encodeURIComponent(activeEnv)}`);
      setApps(appsResp);

      const nextClusters = {};
      for (const [appname, app] of Object.entries(appsResp || {})) {
        nextClusters[appname] = Array.isArray(app?.clusters) ? app.clusters.map(String) : [];
      }
      setClustersByApp(nextClusters);

      // Refresh L4 IPs
      const appNames = Object.keys(appsResp);
      const l4Pairs = await Promise.all(
        appNames.map(async (appname) => {
          const items = await fetchJson(
            `/api/apps/${encodeURIComponent(appname)}/l4_ingress?env=${encodeURIComponent(activeEnv)}`,
          );
          const ips = uniqStrings((items || []).flatMap((i) => i.allocated_ips || []));
          return [appname, ips];
        }),
      );

      const next = {};
      for (const [appname, ips] of l4Pairs) next[appname] = ips;
      setL4IpsByApp(next);

      setSelectedApps(new Set());
      setError("");
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="topbar" style={{ background: bannerColor }}>
        <div>
          <div className="title">{bannerTitle}</div>
          <div className="envLabel">
            Deployment: <span className="pill">{deploymentEnv || "unknown"}</span>
          </div>
        </div>
        <div className="user">{currentUser ? `Logged in as ${currentUser}` : ""}</div>
      </div>

      <div className="container">
        <div className="row">
          <div className="muted">Environments</div>
          <div className="muted">{loading ? "Loading…" : ""}</div>
        </div>

        <div className="tabs">
          {envKeys.map((env) => (
            <button
              key={env}
              className={env === activeEnv ? "tab active" : "tab"}
              onClick={() => {
                setActiveEnv(env);
                pushUiUrl({ view: "apps", env, appname: "" }, false);
              }}
              type="button"
            >
              {env}
            </button>
          ))}
        </div>

        <div className="actions">
          {view === "apps" ? (
            <>
              <button className="btn" type="button" onClick={onViewNamespaces}>
                View Namespaces
              </button>
              <button className="btn" type="button" onClick={onViewL4Ingress}>
                View L4 ingress IPs
              </button>
              <button
                className="btn"
                type="button"
                onClick={deleteSelectedApps}
                style={{ backgroundColor: "#dc3545", color: "white" }}
                disabled={selectedApps.size === 0}
              >
                Delete Selected Apps ({selectedApps.size})
              </button>
            </>
          ) : view === "l4ingress" ? (
            <>
              <button className="btn" type="button" onClick={onBackToApps}>
                Back to App
              </button>
              <button className="btn" type="button" onClick={onViewNamespaces}>
                View Namespaces
              </button>
            </>
          ) : (
            <>
              <button className="btn" type="button" onClick={onBackToApps}>
                Back to App
              </button>
              <button className="btn" type="button" onClick={onViewL4Ingress}>
                View L4 ingress IPs
              </button>
              <button
                className="btn"
                type="button"
                onClick={deleteSelectedNamespaces}
                style={{ backgroundColor: "#dc3545", color: "white" }}
                disabled={selectedNamespaces.size === 0}
              >
                Delete Selected Namespaces ({selectedNamespaces.size})
              </button>
            </>
          )}
        </div>

        {error ? <div className="status">Error: {error}</div> : null}

        {view === "apps" ? (
          <AppsTable
            rows={appRows}
            clustersByApp={clustersByApp}
            l4IpsByApp={l4IpsByApp}
            selectedApps={selectedApps}
            onToggleRow={toggleRow}
            onSelectAll={onSelectAllFromFiltered}
          />
        ) : view === "namespaces" ? (
          <div>
            <div style={{ marginTop: 8, marginBottom: 10, fontWeight: 600 }}>
              {`namespaces allocated in different cluster for ${detailAppName || ""}`}
            </div>
            <NamespacesTable
              namespaces={namespaces}
              selectedNamespaces={selectedNamespaces}
              onToggleNamespace={toggleNamespace}
              onSelectAll={onSelectAllNamespaces}
            />
          </div>
        ) : (
          <div>
            <div style={{ marginTop: 8, marginBottom: 10, fontWeight: 600 }}>
              {`L4 ingress IPs allocated in different cluster for ${detailAppName || ""}`}
            </div>
            <L4IngressTable
              items={l4IngressItems}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
