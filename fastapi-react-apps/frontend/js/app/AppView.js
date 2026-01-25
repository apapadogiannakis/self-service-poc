function AppView({
  bannerColor,
  bannerTitle,
  deploymentEnv,
  currentUser,
  topTab,
  configComplete,
  onTopTabChange,
  workspace,
  setWorkspace,
  requestsRepo,
  setRequestsRepo,
  processedRepo,
  setProcessedRepo,
  onSaveConfig,
  envKeys,
  activeEnv,
  loading,
  view,
  error,
  onEnvClick,
  onViewNamespaces,
  onViewL4Ingress,
  onViewEgressIps,
  onBackToApps,
  onBackFromNamespaceDetails,
  appRows,
  clustersByApp,
  l4IpsByApp,
  egressIpsByApp,
  selectedApps,
  toggleRow,
  onSelectAllFromFiltered,
  deleteApp,
  openNamespaces,
  detailNamespace,
  detailNamespaceName,
  namespaces,
  selectedNamespaces,
  toggleNamespace,
  onSelectAllNamespaces,
  deleteNamespace,
  viewNamespaceDetails,
  detailAppName,
  l4IngressItems,
  egressIpItems,
  selectedEgressIps,
  toggleEgressIp,
  onSelectAllEgressIps,
}) {
  const showProvisioningTabs = Boolean(configComplete);
  const canSaveConfig = Boolean(
    (workspace || "").trim() && (requestsRepo || "").trim() && (processedRepo || "").trim(),
  );

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
        <div className="tabs">
          <button
            className={topTab === "Home" ? "tab active" : "tab"}
            onClick={() => onTopTabChange("Home")}
            type="button"
          >
            Home
          </button>
          {showProvisioningTabs ? (
            <>
              <button
                className={topTab === "Request provisioning" ? "tab active" : "tab"}
                onClick={() => onTopTabChange("Request provisioning")}
                type="button"
              >
                Request provisioning
              </button>
              <button
                className={topTab === "PRs and Approval" ? "tab active" : "tab"}
                onClick={() => onTopTabChange("PRs and Approval")}
                type="button"
              >
                PRs and Approval
              </button>
            </>
          ) : null}
        </div>

        {error ? <div className="status">Error: {error}</div> : null}

        {topTab === "Home" ? (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 12, fontWeight: 600 }}>
              Welcome to Kubernetes self provisioning tool. This tool provides self service for application teams to request resources in their allocated clusters
            </div>

            <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
              <div>
                <div className="muted" style={{ marginBottom: 4 }}>WORKSPACE</div>
                <input className="filterInput" placeholder="~/workspace" value={workspace} onChange={(e) => setWorkspace(e.target.value)} />
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 4 }}>RequestsRepo</div>
                <input className="filterInput" value={requestsRepo} onChange={(e) => setRequestsRepo(e.target.value)} />
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 4 }}>ProcessedRepo</div>
                <input className="filterInput" value={processedRepo} onChange={(e) => setProcessedRepo(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn btn-primary" type="button" onClick={onSaveConfig} disabled={!canSaveConfig || loading}>
                  Save
                </button>
                {!configComplete ? (
                  <span className="muted">Set all fields to enable provisioning tabs.</span>
                ) : null}
              </div>
            </div>
          </div>
        ) : topTab === "PRs and Approval" ? (
          <div className="card" style={{ padding: 16 }}>
            <div className="muted">Coming soon.</div>
          </div>
        ) : (
          <>
            <div className="row">
              <div className="muted">{loading ? "Loading…" : ""}</div>
            </div>

            <div className="tabs">
              {envKeys.map((env) => (
                <button
                  key={env}
                  className={env === activeEnv ? "tab active" : "tab"}
                  onClick={() => onEnvClick(env)}
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
                  <button className="btn" type="button" onClick={onViewEgressIps}>
                    View Egress IPs
                  </button>
                </>
              ) : view === "namespaceDetails" ? (
                <>
                  <button className="btn" type="button" onClick={onBackFromNamespaceDetails}>
                    ← Back to Namespaces
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
                  <button className="btn" type="button" onClick={onViewEgressIps}>
                    View Egress IPs
                  </button>
                </>
              ) : view === "egressips" ? (
                <>
                  <button className="btn" type="button" onClick={onBackToApps}>
                    Back to App
                  </button>
                  <button className="btn" type="button" onClick={onViewNamespaces}>
                    View Namespaces
                  </button>
                  <button className="btn" type="button" onClick={onViewL4Ingress}>
                    View L4 ingress IPs
                  </button>
                </>
              ) : (
                <button className="btn" type="button" onClick={onBackToApps}>
                  Back to App
                </button>
              )}
            </div>

            {view === "apps" ? (
              <AppsTable
                rows={appRows}
                clustersByApp={clustersByApp}
                l4IpsByApp={l4IpsByApp}
                egressIpsByApp={egressIpsByApp}
                selectedApps={selectedApps}
                onToggleRow={toggleRow}
                onSelectAll={onSelectAllFromFiltered}
                onDeleteApp={deleteApp}
                onViewDetails={(appname) => openNamespaces(appname, true)}
              />
            ) : view === "namespaceDetails" ? (
              <NamespaceDetails namespace={detailNamespace} namespaceName={detailNamespaceName} />
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
                  onDeleteNamespace={deleteNamespace}
                  onViewDetails={viewNamespaceDetails}
                />
              </div>
            ) : view === "l4ingress" ? (
              <div>
                <div style={{ marginTop: 8, marginBottom: 10, fontWeight: 600 }}>
                  {`L4 ingress IPs allocated in different cluster for ${detailAppName || ""}`}
                </div>
                <L4IngressTable items={l4IngressItems} />
              </div>
            ) : (
              <div>
                <div style={{ marginTop: 8, marginBottom: 10, fontWeight: 600 }}>
                  {`Egress IPs allocated in different cluster for ${detailAppName || ""}`}
                </div>
                <EgressIpTable
                  items={egressIpItems}
                  selectedItems={selectedEgressIps}
                  onToggleRow={toggleEgressIp}
                  onSelectAll={onSelectAllEgressIps}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
