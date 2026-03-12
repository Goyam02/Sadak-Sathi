# Contributing to Sadak Saathi

First off, thank you for considering contributing to Sadak Saathi! 🙏

Every contribution helps protect two-wheeler riders across India. Whether it's fixing a bug, improving documentation, or adding a new feature, your work makes a real-world impact.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Areas We Need Help](#areas-we-need-help)

---

## 🤝 Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow:

- **Be respectful** and inclusive in all interactions
- **Be constructive** in feedback and criticism
- **Focus on what's best** for the community and end users
- **Show empathy** towards other community members

Unacceptable behavior will not be tolerated.

---

## 🎯 How Can I Contribute?

### Reporting Bugs

Found a bug? Help us fix it:

1. **Check if it's already reported:** Search [existing issues](https://github.com/Goyam02/Sadak-Sathi/issues)
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos if applicable
   - Environment details (OS, app version, device)

**Example:**
```
Title: YOLO detection crashes on Samsung Galaxy A50

Steps to reproduce:
1. Mount phone on handlebar
2. Start navigation
3. Camera activates
4. App crashes after ~30 seconds

Expected: YOLO runs continuously
Actual: App force closes

Environment:
- Device: Samsung Galaxy A50 (Android 12)
- App version: 1.2.3
- Backend: v1.1.0
```

### Suggesting Features

Have an idea? We'd love to hear it:

1. **Check existing feature requests** in [Discussions](https://github.com/Goyam02/Sadak-Sathi/discussions)
2. **Open a new discussion** with:
   - Problem you're trying to solve
   - Proposed solution
   - Alternative solutions considered
   - Impact on users

### Contributing Code

Ready to code? Follow these steps:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/your-feature-name`
3. **Make your changes** (see [Coding Standards](#coding-standards))
4. **Add tests** for new functionality
5. **Ensure all tests pass**
6. **Commit with clear messages** (see [Commit Guidelines](#commit-guidelines))
7. **Push to your fork:** `git push origin feature/your-feature-name`
8. **Open a Pull Request**

---

## 🛠️ Development Setup

### Backend (FastAPI)

```bash
cd sadak-saathi-backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
alembic upgrade head
uvicorn app.main:app --reload
```

### Mobile (React Native + Expo)

```bash
cd SadakSaathi
npm install
cp .env.example .env
# Edit .env with backend URL and API keys
npx expo start
```

### Running Tests

```bash
# Backend
cd sadak-saathi-backend
pytest tests/ -v --cov=app

# Mobile (when available)
cd SadakSaathi
npm test
```

---

## 📝 Coding Standards

### Python (Backend)

**Style:** PEP 8 + Black formatter

```python
# ✅ Good
def calculate_severity(impact: float, velocity: float) -> int:
    """
    Calculate pothole severity from impact force and vehicle velocity.
    
    Args:
        impact: Impact force in m/s²
        velocity: Vehicle velocity in m/s
    
    Returns:
        Severity level (1, 2, or 3)
    """
    if impact < 8:
        return 1
    elif impact < 15:
        return 2
    return 3

# ❌ Bad
def calc_sev(i,v):
    if i<8: return 1
    elif i<15: return 2
    return 3
```

**Type Hints:** Required for all functions
```python
from typing import Optional, List
from app.models.hazard import Hazard

def get_hazards(bbox: tuple[float, float, float, float]) -> List[Hazard]:
    ...
```

**Docstrings:** Google style for public APIs
```python
def cluster_hazards(hazards: List[Hazard], radius: float = 8.0) -> List[List[Hazard]]:
    """
    Cluster nearby hazards using DBSCAN.
    
    Args:
        hazards: List of hazard objects with lat/long
        radius: Clustering radius in metres (default: 8.0)
    
    Returns:
        List of hazard clusters, each cluster is a list of hazards
    
    Raises:
        ValueError: If radius is negative or zero
    """
```

**Formatting:**
```bash
# Format code with Black
black app/ tests/

# Sort imports with isort
isort app/ tests/

# Check types with mypy (optional but encouraged)
mypy app/
```

### TypeScript (Mobile)

**Style:** Prettier + ESLint

```typescript
// ✅ Good
interface HazardAlertProps {
  hazard: Hazard;
  distance: number;
  onDismiss: () => void;
}

const HazardAlert: React.FC<HazardAlertProps> = ({ hazard, distance, onDismiss }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (distance < 50) {
      playAlertSound();
    }
  }, [distance]);
  
  return (
    <View style={styles.container}>
      <Text>{hazard.severity} pothole - {distance}m ahead</Text>
    </View>
  );
};

// ❌ Bad
const HazardAlert = (props) => {
  let visible = true
  if(props.distance<50) playAlertSound()
  return <View><Text>{props.hazard.severity} pothole - {props.distance}m ahead</Text></View>
}
```

**Formatting:**
```bash
# Format code
npx prettier --write src/

# Lint
npx eslint src/ --fix
```

### SQL Migrations (Alembic)

```python
# ✅ Good: Clear upgrade and downgrade paths
def upgrade():
    op.add_column('hazards', sa.Column('water_detected', sa.Boolean(), nullable=True))
    op.create_index('idx_water_hazards', 'hazards', ['water_detected', 'severity'])

def downgrade():
    op.drop_index('idx_water_hazards')
    op.drop_column('hazards', 'water_detected')
```

---

## 💬 Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic change)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependency updates

### Examples

**Simple commit:**
```bash
git commit -m "feat: add offline map caching"
```

**Detailed commit:**
```bash
git commit -m "feat(mobile): add offline map caching

Implements 24-hour hazard cache using AsyncStorage.
Reduces API calls by 80% for repeat routes.

Closes #123"
```

**Breaking change:**
```bash
git commit -m "feat(api)!: change hazard response format

BREAKING CHANGE: Hazard API now returns GeoJSON instead of custom format.
Frontend clients need to update parsing logic."
```

---

## 🔄 Pull Request Process

### Before Opening PR

1. **Update from main:**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run all tests:**
   ```bash
   pytest tests/ -v  # Backend
   npm test          # Mobile
   ```

3. **Check code style:**
   ```bash
   black --check app/        # Backend
   prettier --check src/     # Mobile
   ```

### PR Checklist

- [ ] Tests added/updated for new functionality
- [ ] All tests pass locally
- [ ] Code follows project style guidelines
- [ ] Documentation updated (README, API docs, comments)
- [ ] Commit messages follow conventional format
- [ ] Screenshots added for UI changes
- [ ] No merge conflicts with main branch

### PR Template

When you open a PR, please include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How to Test
1. Step one
2. Step two
3. Expected result

## Screenshots (if applicable)
Before | After

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks run:** Tests, linting, type checking
2. **Maintainer review:** Usually within 48 hours
3. **Feedback addressed:** Make requested changes
4. **Approval:** At least one maintainer approval required
5. **Merge:** Squash and merge to main
6. **Deploy:** Automatically deployed to staging

---

## 🎯 Areas We Need Help

### High Priority

**Backend:**
- [ ] Implement contractor database scraper (PWD contracts)
- [ ] Build Sentinel-2 fraud detection pipeline
- [ ] Add comprehensive API authentication
- [ ] Optimize PostGIS spatial queries (currently slow on >10k hazards)
- [ ] Add Redis caching layer for frequently accessed routes

**Mobile:**
- [ ] Implement offline mode (24h map cache)
- [ ] Add battery optimization for background detection
- [ ] Build iOS widget for morning brief
- [ ] Add multilingual support (Hindi, Tamil, Telugu)
- [ ] Improve YOLO inference speed on low-end devices

**ML/Data Science:**
- [ ] Improve LSTM accuracy from 89% to 95%+
- [ ] Train road degradation predictor (XGBoost + weather)
- [ ] Add pothole depth estimation from shadow analysis
- [ ] Build contractor performance prediction model
- [ ] Implement anomaly detection for fraudulent reports

**Documentation:**
- [ ] Create video tutorials for setup
- [ ] Write API integration guide for delivery companies
- [ ] Translate documentation to Hindi
- [ ] Add architecture diagrams (system, data flow, deployment)
- [ ] Create contributor onboarding guide

**DevOps:**
- [ ] Set up CI/CD with GitHub Actions
- [ ] Add automated security scanning
- [ ] Implement blue-green deployment
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Add automated performance testing

### Good First Issues

Look for issues tagged with `good-first-issue` on GitHub. These are:
- Well-defined scope
- Clear acceptance criteria
- Mentorship available from maintainers
- Usually completable in < 4 hours

---

## 🏅 Recognition

Contributors will be recognized in:
- **README.md** — Contributors section
- **Release notes** — Major contributions highlighted
- **Annual report** — Top contributors featured
- **Swag** — Stickers/t-shirts for significant contributions

Top contributors may be invited to join the core team!

---

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [PostGIS Documentation](https://postgis.net/documentation/)

---

## ❓ Questions?

- **General questions:** [GitHub Discussions](https://github.com/Goyam02/Sadak-Sathi/discussions)
- **Bug reports:** [GitHub Issues](https://github.com/Goyam02/Sadak-Sathi/issues)
- **Real-time chat:** Discord (link TBD)
- **Email:** contribute@sadaksaathi.in

---

**Thank you for making Indian roads safer! 🛵💨**
