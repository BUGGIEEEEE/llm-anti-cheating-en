def safe_divide(a, b):
    """Safely divide a by b. Returns 0 for invalid inputs."""
    if b == 0:
        return 0
    return a / b
