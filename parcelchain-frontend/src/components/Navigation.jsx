const Navigation = ({ activeSection, setActiveSection }) => {
  return (
    <div className="section-nav">
      <button
        className={`nav-button ${activeSection === 'add' ? 'active' : ''}`}
        onClick={() => setActiveSection('add')}
      >
        Add New Package
      </button>
      <button
        className={`nav-button ${activeSection === 'my' ? 'active' : ''}`}
        onClick={() => setActiveSection('my')}
      >
        My Packages
      </button>
      <button
        className={`nav-button ${activeSection === 'all' ? 'active' : ''}`}
        onClick={() => setActiveSection('all')}
      >
        All Packages
      </button>
    </div>
  );
};

export default Navigation; 