function EgressIpTable({ items, selectedItems, onToggleRow, onSelectAll }) {
  const [filters, setFilters] = React.useState({
    cluster: "",
    allocation_id: "",
    allocated_ips: "",
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

  const filteredItems = (items || []).filter((item, index) => {
    const cluster = formatValue(item?.cluster).toLowerCase();
    const allocationId = formatValue(item?.allocation_id).toLowerCase();
    const allocatedIps = formatValue(item?.allocated_ips).toLowerCase();

    return (
      cluster.includes((filters.cluster || "").toLowerCase()) &&
      allocationId.includes((filters.allocation_id || "").toLowerCase()) &&
      allocatedIps.includes((filters.allocated_ips || "").toLowerCase())
    );
  });

  const allSelected = filteredItems.length > 0 && filteredItems.every((item, index) => selectedItems.has(index));

  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked, filteredItems.map((_, index) => index))}
                aria-label="Select all rows"
              />
            </th>
            <th>Cluster</th>
            <th>Allocation ID</th>
            <th>Allocated IPs</th>
            <th>Link</th>
          </tr>
          <tr>
            <th></th>
            <th>
              <input
                className="filterInput"
                value={filters.cluster}
                onChange={(e) => setFilters((p) => ({ ...p, cluster: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.allocation_id}
                onChange={(e) => setFilters((p) => ({ ...p, allocation_id: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                value={filters.allocated_ips}
                onChange={(e) => setFilters((p) => ({ ...p, allocated_ips: e.target.value }))}
              />
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.length === 0 ? (
            <tr>
              <td colSpan={5} className="muted">No egress IPs found.</td>
            </tr>
          ) : (
            filteredItems.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(index)}
                    onChange={(e) => onToggleRow(index, e.target.checked)}
                    aria-label={`Select egress IP ${index}`}
                  />
                </td>
                <td>{item.cluster || ""}</td>
                <td>{item.allocation_id || ""}</td>
                <td>{(item.allocated_ips || []).join(", ")}</td>
                <td>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      View allocated
                    </a>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
