import math

def generate_svg():
    # Size 240x240, Center at (120, 120)
    # 180-degree rotational symmetry around (120, 120)
    
    # Let's define the top arrow:
    # Outer top horizontal segment: y_top = 34, y_inner = 62 (thickness = 28)
    # Top-right arrowhead:
    #   Tip: (196, 48)
    #   Top barb: (156, 18)
    #   Bottom barb: (156, 78)
    #   Shaft junction top: (156, 34)
    #   Shaft junction bottom: (156, 62)
    #
    # Top-left outer curve:
    #   Starts at (156, 34), goes left to (86, 34)
    #   Outer arc centered around (86, 88) with R = 54:
    #   Sweeps from (86, 34) down-left to (32, 88)
    #   Continues down to (32, 110)
    #   Then curves inwards towards the diagonal down-right:
    #   From (32, 110) to (58, 142)
    #
    # Center arrowhead (pointing down-left at angle ~ 140 deg, i.e. dx = -0.76, dy = 0.64):
    #   Let's position the center arrowhead:
    #   Tip of center arrow: (78, 154)
    #   Head barbs:
    #     Outer barb: (108, 132)
    #     Inner barb: (72, 122)
    #   Wait, let's make the center arrowhead sharp and clean:
    #   Base center at (92, 136).
    #   Tip at (72, 154) -> vector from base to tip is (-20, 18), length ~ 27.
    #   Wings extend perpendicular: dx = 18, dy = 20:
    #     Right barb: (92 + 13, 136 + 11) = (105, 147)
    #     Left barb: (92 - 13, 136 - 11) = (79, 125)
    #   Notches connect to the shaft of thickness 28.
    
    pass

