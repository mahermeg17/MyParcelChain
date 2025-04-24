const PackageList = ({ packages, title }) => {
  if (!packages || packages.length === 0) {
    return (
      <div className="no-packages">
        <p>No packages found</p>
      </div>
    );
  }

  return (
    <div className="package-list">
      <h2>{title}</h2>
      <div className="packages-grid">
        {packages.map((pkg) => (
          <div key={pkg.trackingNumber} className="package-card">
            <h3>Tracking Number: {pkg.trackingNumber}</h3>
            <p><strong>Description:</strong> {pkg.description}</p>
            <p><strong>Weight:</strong> {pkg.weight} grams</p>
            <p><strong>Dimensions:</strong> {pkg.dimensions.length}x{pkg.dimensions.width}x{pkg.dimensions.height} cm</p>
            <p><strong>Origin:</strong> {pkg.origin}</p>
            <p><strong>Destination:</strong> {pkg.destination}</p>
            <p><strong>Status:</strong> {Object.keys(pkg.status)[0]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageList; 