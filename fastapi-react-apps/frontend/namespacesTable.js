function NamespacesTable({ namespaces, selectedNamespaces, onToggleNamespace, onSelectAll }) {
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
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 ? (
            <tr>
              <td colSpan={7} className="muted">No namespaces found.</td>
            </tr>
          ) : filteredKeys.length === 0 ? (
            <tr>
              <td colSpan={7} className="muted">No matches.</td>
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
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
