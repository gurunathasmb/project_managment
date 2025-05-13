import { useState, useEffect } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import '../css/LandingPage.css';

export default function PlanovaLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing fullwidth">
      {/* Navigation Bar */}
      <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <div className="container-fluid">
          <div className="nav-content">
            <div className="logo">
              <div className="logo-icon">P</div>
              <span className="logo-text">Planova</span>
            </div>

            <nav className="nav-links">
              <a href="#features">Features</a>
              <a href="#workflow">Workflow</a>
              <a href="#pricing">Pricing</a>
              <a href="#testimonials">Testimonials</a>
            </nav>

            <div className="nav-actions">
              <button className="btn-text" onClick={() => navigate('/login')}>Sign in</button>
            </div>

            <div className="menu-icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Testimonials</a>
            <div className="mobile-buttons">
              <button className="btn-text" onClick={() => navigate('/login')}>Sign in</button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero fullwidth-hero">
        <div className="blur blur-1"></div>
        <div className="blur blur-2"></div>
        <div className="blur blur-3"></div>

        <div className="container-fluid">
          <div className="hero-grid">
            <div className="hero-text">
              <h1>
                <span>Planova</span>
                <span className="subheading">project management</span>
                <span className="highlight">for professionals</span>
              </h1>
              <p>
                Empower your team's productivity and bring your project ideas to life with our intuitive management tools.
              </p>
              <div className="hero-buttons">
                <button className="btn-primary" onClick={handleGetStarted}>
                  Get Started <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="enhanced-mockup">
                <div className="mockup-header">
                  <div className="dots">
                    <div className="dot red"></div>
                    <div className="dot yellow"></div>
                    <div className="dot green"></div>
                  </div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-content">
                    <div className="project-dashboard">
                      <div className="dashboard-header">
                        <div className="dashboard-title">Project Dashboard</div>
                        <div className="dashboard-actions"></div>
                      </div>
                      <div className="chart-container">
                        <div className="chart-bar chart-bar-1"></div>
                        <div className="chart-bar chart-bar-2"></div>
                        <div className="chart-bar chart-bar-3"></div>
                        <div className="chart-bar chart-bar-4"></div>
                      </div>
                      <div className="task-list">
                        <div className="task-item">
                          <div className="task-status completed"></div>
                          <div className="task-content"></div>
                        </div>
                        <div className="task-item">
                          <div className="task-status in-progress"></div>
                          <div className="task-content"></div>
                        </div>
                        <div className="task-item">
                          <div className="task-status"></div>
                          <div className="task-content"></div>
                        </div>
                      </div>
                    </div>
                    <div className="project-sidebar">
                      <div className="sidebar-section">
                        <div className="sidebar-header"></div>
                        <div className="sidebar-content">
                          <div className="team-member"></div>
                          <div className="team-member"></div>
                          <div className="team-member"></div>
                        </div>
                      </div>
                      <div className="sidebar-section">
                        <div className="sidebar-header"></div>
                        <div className="sidebar-content">
                          <div className="progress-bar"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features fullwidth-section">
        <div className="container-fluid">
          <div className="section-header">
            <h2>Powerful project management features</h2>
            <p>Everything you need to manage projects efficiently in one place</p>
          </div>

          <div className="feature-grid">
            {[
              { title: "Task Tracking", description: "Create, assign and track tasks with ease" },
              { title: "Timeline Management", description: "Visualize project timelines and dependencies" },
              { title: "Resource Allocation", description: "Optimize team workload and resource distribution" },
              { title: "Reporting & Analytics", description: "Get insights with customizable dashboards" },
              { title: "Team Collaboration", description: "Communicate and share files in context" },
              { title: "Automation", description: "Automate repetitive tasks and workflows" }
            ].map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon"></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta fullwidth-section">
        <div className="container-fluid">
          <div className="cta-content">
            <div>
              <h2>
                <span>Ready to streamline your projects?</span>
                <span className="cta-highlight">Start your free trial today.</span>
              </h2>
              <p>Join thousands of teams already using Planova to deliver better projects, faster.</p>
            </div>
            <div>
              <button className="btn-primary" onClick={handleGetStarted}>
                Get Started <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container-fluid">
          <div className="footer-content">
            <div className="logo">
              <div className="logo-icon">P</div>
              <span className="logo-text">Planova</span>
            </div>
            <div className="footer-copy">© 2025 Planova. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}