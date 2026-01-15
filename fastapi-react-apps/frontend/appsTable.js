function AppsTable({ rows, clustersByApp, l4IpsByApp, egressIpsByApp, selectedApps, onToggleRow, onSelectAll }) {
  const [filters, setFilters] = React.useState({
    appname: "",
    description: "",
    managedby: "",
    clusters: "",
    namespaces: "",
    l4ips: "",
    egressips: "",
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

  const filteredRows = (rows || []).filter((a) => {
    const appname = formatValue(a?.appname).toLowerCase();
    const description = formatValue(a?.description).toLowerCase();
    const managedby = formatValue(a?.managedby).toLowerCase();
    const clusters = formatValue((clustersByApp?.[a?.appname] || []).join(", ")).toLowerCase();
    const namespacesCount = formatValue(a?.totalns).toLowerCase();
    const l4ips = formatValue((l4IpsByApp?.[a?.appname] || []).join(", ")).toLowerCase();
    const egressips = formatValue((egressIpsByApp?.[a?.appname] || []).join(", ")).toLowerCase();

    return (
      appname.includes((filters.appname || "").toLowerCase()) &&
      description.includes((filters.description || "").toLowerCase()) &&
      managedby.includes((filters.managedby || "").toLowerCase()) &&
      clusters.includes((filters.clusters || "").toLowerCase()) &&
      namespacesCount.includes((filters.namespaces || "").toLowerCase()) &&
      l4ips.includes((filters.l4ips || "").toLowerCase()) &&
      egressips.includes((filters.egressips || "").toLowerCase())
    );
  });

  const allSelected = filteredRows.length > 0 && filteredRows.every((a) => selectedApps.has(a.appname));

  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked, filteredRows.map((a) => a.appname))}
                aria-label="Select all rows"
              />
            </th>
            <th>App Name</th>
            <th>Description</th>
            <th>Managed By</th>
            <th>Clusters</th>
            <th>Namespaces</th>
            <th>L4 IPs</th>
            <th>Egress IPs</th>
          </tr>
          <tr>
            <th></th>
            <th>
              <input
                className="filterInput"
                value={filters.appname}
                onChange={(e) => setFilters((p) => ({ ...p, appname: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.description}
                onChange={(e) => setFilters((p) => ({ ...p, description: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.managedby}
                onChange={(e) => setFilters((p) => ({ ...p, managedby: e.target.value }))}
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
                value={filters.namespaces}
                onChange={(e) => setFilters((p) => ({ ...p, namespaces: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.l4ips}
                onChange={(e) => setFilters((p) => ({ ...p, l4ips: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.egressips}
                onChange={(e) => setFilters((p) => ({ ...p, egressips: e.target.value }))}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={8} className="muted">No apps found.</td>
            </tr>
          ) : (
            filteredRows.map((a) => (
              <tr key={a.appname}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedApps.has(a.appname)}
                    onChange={(e) => onToggleRow(a.appname, e.target.checked)}
                    aria-label={`Select ${a.appname}`}
                  />
                </td>
                <td>{a.appname}</td>
                <td className="muted">{a.description || ""}</td>
                <td>{a.managedby || ""}</td>
                <td>{(clustersByApp?.[a.appname] || []).join(", ")}</td>
                <td>{a.totalns ?? ""}</td>
                <td>{(l4IpsByApp?.[a.appname] || []).join(", ")}</td>
                <td>{(egressIpsByApp?.[a.appname] || []).join(", ")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
