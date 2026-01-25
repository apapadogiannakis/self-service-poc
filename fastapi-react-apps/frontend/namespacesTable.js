function NamespacesTable({ namespaces, selectedNamespaces, onToggleNamespace, onSelectAll, onDeleteNamespace, onViewDetails }) {
  const [filters, setFilters] = React.useState({
    name: "",
    clusters: "",
    egressIp: "",
    egressFirewall: "",
    managedByArgo: "",
    attributes: "",
  });

  function formatValue(val) {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  }

  const keys = Object.keys(namespaces || {});
  const filteredKeys = keys.filter((k) => {
    const ns = namespaces[k];
    const name = formatValue(ns?.name || k);
    const managedByArgo = Boolean(ns?.need_argo || ns?.generate_argo_app);

    const clustersText = formatValue(ns?.clusters);
    const egressIpText = `${formatValue(ns?.egress_nameid)} ${formatValue(
      Boolean(ns?.enable_pod_based_egress_ip),
    )}`;
    const egressFirewallText = formatValue(ns?.file_index?.egress);
    const resourcesText = formatValue(ns?.resources);
    const rbacText = formatValue(ns?.rbac);
    const statusText = formatValue(ns?.status);
    const policyText = formatValue(ns?.policy);

    const attributesSearch = `${statusText} ${resourcesText} ${rbacText} ${policyText}`;

    return (
      name.toLowerCase().includes((filters.name || "").toLowerCase()) &&
      clustersText.toLowerCase().includes((filters.clusters || "").toLowerCase()) &&
      egressIpText.toLowerCase().includes((filters.egressIp || "").toLowerCase()) &&
      egressFirewallText.toLowerCase().includes((filters.egressFirewall || "").toLowerCase()) &&
      String(managedByArgo ? "true" : "false")
        .toLowerCase()
        .includes((filters.managedByArgo || "").toLowerCase()) &&
      attributesSearch.toLowerCase().includes((filters.attributes || "").toLowerCase())
    );
  });

  const allSelected = filteredKeys.length > 0 && filteredKeys.every((k) => {
    const ns = namespaces[k];
    const name = ns?.name || k;
    return selectedNamespaces?.has(name);
  });

  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => {
                  const names = filteredKeys.map((k) => {
                    const ns = namespaces[k];
                    return ns?.name || k;
                  });
                  onSelectAll(e.target.checked, names);
                }}
                aria-label="Select all namespaces"
              />
            </th>
            <th>Name</th>
            <th>Clusters</th>
            <th>EgressIP</th>
            <th>Egress Firewall</th>
            <th>Managed by App Argo</th>
            <th>Attributes</th>
            <th>Actions</th>
          </tr>
          <tr>
            <th></th>
            <th>
              <input
                className="filterInput"
                value={filters.name}
                onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.clusters}
                onChange={(e) => setFilters((p) => ({ ...p, clusters: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.egressIp}
                onChange={(e) => setFilters((p) => ({ ...p, egressIp: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.egressFirewall}
                onChange={(e) => setFilters((p) => ({ ...p, egressFirewall: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.managedByArgo}
                onChange={(e) => setFilters((p) => ({ ...p, managedByArgo: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.attributes}
                onChange={(e) => setFilters((p) => ({ ...p, attributes: e.target.value }))}
              />
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 ? (
            <tr>
              <td colSpan={8} className="muted">No namespaces found.</td>
            </tr>
          ) : filteredKeys.length === 0 ? (
            <tr>
              <td colSpan={8} className="muted">No matches.</td>
            </tr>
          ) : (
            filteredKeys.map((k) => {
              const ns = namespaces[k];
              const name = ns?.name || k;
              const managedByArgo = Boolean(ns?.need_argo || ns?.generate_argo_app);
              const clustersText = formatValue(ns?.clusters);
              const egressIpText = `${formatValue(ns?.egress_nameid)} / podBased:${
                ns?.enable_pod_based_egress_ip ? "true" : "false"
              }`;
              const egressFirewallText = formatValue(ns?.file_index?.egress);
              const resourcesText = formatValue(ns?.resources);
              const rbacText = formatValue(ns?.rbac);
              const statusText = formatValue(ns?.status);
              const policyText = formatValue(ns?.policy);

              return (
                <tr key={name}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedNamespaces?.has(name) || false}
                      onChange={(e) => onToggleNamespace(name, e.target.checked)}
                      aria-label={`Select ${name}`}
                    />
                  </td>
                  <td>{name}</td>
                  <td>{clustersText}</td>
                  <td>{egressIpText}</td>
                  <td>{egressFirewallText}</td>
                  <td>{managedByArgo ? "True" : "False"}</td>
                  <td>
                    <div className="attrGrid">
                      <div className="attrRow">
                        <div className="attrCell">
                          <div className="attrTitle">Status</div>
                          <div className="attrValue">{statusText}</div>
                        </div>
                        <div className="attrCell">
                          <div className="attrTitle">Resources</div>
                          <div className="attrValue">{resourcesText}</div>
                        </div>
                        <div className="attrCell">
                          <div className="attrTitle">RBAC</div>
                          <div className="attrValue">{rbacText}</div>
                        </div>
                      </div>
                      <div className="attrRow">
                        <div className="attrCell">
                          <div className="attrTitle">Policy</div>
                          <div className="attrValue">{policyText}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="iconBtn iconBtn-primary"
                        onClick={() => onViewDetails(name, ns)}
                        aria-label={`View details for ${name}`}
                        title="View namespace details"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                          <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                        </svg>
                      </button>
                      <button
                        className="iconBtn iconBtn-danger"
                        onClick={() => onDeleteNamespace(name)}
                        aria-label={`Delete ${name}`}
                        title="Delete namespace"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
