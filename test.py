import pygame
import random
import pygame_gui

# Initialize pygame
pygame.init()

# Screen dimensions
screen_width = 800
screen_height = 600

# Colors
white = (255, 255, 255)
black = (0, 0, 0)

# Create the screen
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption("Random Moving Points")

# Initialize pygame_gui
manager = pygame_gui.UIManager((screen_width, screen_height))

# Point class
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def move(self):
        self.x += random.randint(-5, 5)
        self.y += random.randint(-5, 5)
        
        # Ensure the point stays within screen boundaries
        self.x = max(0, min(self.x, screen_width))
        self.y = max(0, min(self.y, screen_height))

# Create points
num_points = 4
points = [Point(random.randint(0, screen_width), random.randint(0, screen_height)) for _ in range(num_points)]

# Slider settings
slider_rect = pygame.Rect(50, 500, 300, 20)
slider_range = (10, 200)
slider_value = 100

slider = pygame_gui.elements.UIHorizontalSlider(relative_rect=slider_rect, start_value=slider_value, value_range=slider_range, manager=manager)

# Main loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        manager.process_events(event)

    # Get the current slider value
    slider_value = int(slider.get_current_value())

    # Move points
    for point in points:
        point.move()

    # Clear the screen
    screen.fill(white)

    # Draw lines between points within the slider range
    for i in range(num_points):
        for j in range(i + 1, num_points):
            distance = ((points[i].x - points[j].x) ** 2 + (points[i].y - points[j].y) ** 2) ** 0.5
            if distance <= slider_value:
                pygame.draw.line(screen, black, (points[i].x, points[i].y), (points[j].x, points[j].y), 1)

    # Draw points
    for point in points:
        pygame.draw.circle(screen, black, (point.x, point.y), 5)

    # Update the display
    pygame.display.update()
    manager.update(1/60.0)

    # Draw the slider
    manager.draw_ui(screen)

# Quit pygame
pygame.quit()
