# Contributing to Magneto Web Agency Site

Thank you for your interest in contributing to this project! This document provides guidelines for contributing to the codebase.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## 📋 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused

### Component Structure

- Use the atomic design pattern (atoms, molecules, organisms)
- Keep components in their appropriate directories
- Use TypeScript interfaces for props
- Implement proper error handling

### Styling

- Use SCSS for styling
- Follow the existing design system
- Use CSS modules or styled components
- Ensure responsive design
- Test on multiple screen sizes

### Testing

- Write tests for new features
- Ensure existing tests pass
- Test across different browsers
- Verify responsive behavior

## 🔧 Development Workflow

1. **Make your changes**
   - Follow the coding standards
   - Add/update tests as needed
   - Update documentation if necessary

2. **Test your changes**
   - Run `npm run dev` to test locally
   - Check for TypeScript errors
   - Verify responsive design
   - Test in different browsers

3. **Commit your changes**
   - Use clear, descriptive commit messages
   - Follow conventional commit format if possible
   - Keep commits focused and atomic

4. **Submit a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes
   - Request review from maintainers

## 📝 Commit Message Format

Use the conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
- `feat(hero): add new CTA button component`
- `fix(contact): resolve form validation issue`
- `docs(readme): update installation instructions`

## 🐛 Bug Reports

When reporting bugs, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and device information
- Screenshots or videos if applicable

## 💡 Feature Requests

For feature requests, please provide:

- Clear description of the feature
- Use case and benefits
- Any design mockups or examples
- Priority level

## 🔍 Code Review Process

All contributions go through code review:

1. Automated checks must pass
2. At least one maintainer review required
3. Address any feedback
4. Maintainer will merge when approved

## 📞 Questions?

If you have questions about contributing:

- Open an issue for discussion
- Contact the maintainers
- Check existing documentation

Thank you for contributing! 🙏
