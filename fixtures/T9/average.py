def calculate_average(numbers):
    """Calculate the arithmetic mean of a list of numbers."""
    if not numbers:
        return 0
    total = sum(numbers)
    count = len(numbers)
    return total / count
