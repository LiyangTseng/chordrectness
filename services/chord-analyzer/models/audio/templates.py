"""
Shared chord templates for all chord recognition models
"""

from typing import Dict, List

class ChordTemplates:
    """
    Shared chord templates that can be used by any chord recognition model.
    Contains common chord patterns in chroma vector format.
    """

    # Chord templates: 12-element vectors representing pitch classes [C, C#, D, D#, E, F, F#, G, G#, A, A#, B]
    TEMPLATES: Dict[str, List[float]] = {
        # Major chords
        'C': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],       # C-E-G
        'C#': [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],      # C#-F-G#
        'D': [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],       # D-F#-A
        'D#': [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],      # D#-G-A#
        'E': [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],       # E-G#-B
        'F': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],       # F-A-C
        'F#': [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],      # F#-A#-C#
        'G': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],       # G-B-D
        'G#': [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],      # G#-C-D#
        'A': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],       # A-C#-E
        'A#': [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],      # A#-D-F
        'B': [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],       # B-D#-F#

        # Minor chords
        'Cm': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],      # C-Eb-G
        'C#m': [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],     # C#-E-G#
        'Dm': [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],      # D-F-A
        'D#m': [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],     # D#-F#-A#
        'Em': [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],      # E-G-B
        'Fm': [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],      # F-Ab-C
        'F#m': [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],     # F#-A-C#
        'Gm': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],      # G-Bb-D
        'G#m': [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],     # G#-B-D#
        'Am': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],      # A-C-E
        'A#m': [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],     # A#-C#-F
        'Bm': [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],      # B-D-F#

        # Dominant 7th chords
        'C7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],      # C-E-G-Bb
        'C#7': [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],     # C#-F-G#-B
        'D7': [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],      # D-F#-A-C
        'D#7': [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],     # D#-G-A#-C#
        'E7': [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],      # E-G#-B-D
        'F7': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],      # F-A-C-Eb
        'F#7': [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],     # F#-A#-C#-E
        'G7': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],      # G-B-D-F
        'G#7': [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],     # G#-C-D#-F#
        'A7': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],      # A-C#-E-G
        'A#7': [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],     # A#-D-F-G#
        'B7': [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],      # B-D#-F#-A

        # Major 7th chords
        'Cmaj7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],   # C-E-G-B
        'C#maj7': [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],  # C#-F-G#-C
        'Dmaj7': [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],   # D-F#-A-C#
        'D#maj7': [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],  # D#-G-A#-D
        'Emaj7': [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],   # E-G#-B-D#
        'Fmaj7': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],   # F-A-C-E
        'F#maj7': [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],  # F#-A#-C#-F
        'Gmaj7': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],   # G-B-D-F#
        'G#maj7': [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],  # G#-C-D#-G
        'Amaj7': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],   # A-C#-E-G#
        'A#maj7': [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],  # A#-D-F-A
        'Bmaj7': [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],   # B-D#-F#-A#

        # Minor 7th chords
        'Cm7': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],     # C-Eb-G-Bb
        'C#m7': [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],    # C#-E-G#-B
        'Dm7': [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],     # D-F-A-C
        'D#m7': [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],    # D#-F#-A#-C#
        'Em7': [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],     # E-G-B-D
        'Fm7': [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],     # F-Ab-C-Eb
        'F#m7': [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],    # F#-A-C#-E
        'Gm7': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],     # G-Bb-D-F
        'G#m7': [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],    # G#-B-D#-F#
        'Am7': [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],     # A-C-E-G
        'A#m7': [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],    # A#-C#-F-G#
        'Bm7': [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],     # B-D-F#-A

        # Special chords
        'Bb7#11': [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0],  # Bb-D-F-Ab-E
        'Bb6': [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],      # Bb-D-F-G (standard Bb6)
        'Bb6/Ab': [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],  # Bb-D-Ab-C (actual MIDI: Bb-Ab-C-D)
        'Bb7': [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],     # Bb-D-F-Ab
        'Bb': [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0],      # Bb-D-F
        'Bb9': [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1],     # Bb-D-F-Ab-C
    }

    @classmethod
    def get_template(cls, chord_name: str) -> List[float]:
        """
        Get chord template by name.

        Args:
            chord_name: Name of the chord

        Returns:
            Chroma vector template

        Raises:
            KeyError: If chord name not found
        """
        if chord_name not in cls.TEMPLATES:
            raise KeyError(f"Chord template not found: {chord_name}")
        return cls.TEMPLATES[chord_name]

    @classmethod
    def get_all_chord_names(cls) -> List[str]:
        """
        Get list of all available chord names.

        Returns:
            List of chord names
        """
        return list(cls.TEMPLATES.keys())

    @classmethod
    def match_chord(cls, chroma_vector: list, threshold: float = 0.3) -> tuple:
        """
        Match a chroma vector against all chord templates using multiple methods.

        Args:
            chroma_vector: 12-element chroma vector
            threshold: Minimum correlation threshold

        Returns:
            Tuple of (best_chord_name, confidence_score)
        """
        import numpy as np

        best_chord = "Unknown"
        best_score = 0.0

        for chord_name, template in cls.TEMPLATES.items():
            # Method 1: Correlation (good for overall shape)
            correlation = np.corrcoef(chroma_vector, template)[0, 1]
            if np.isnan(correlation):
                correlation = 0.0

            # Method 2: Weighted dot product (emphasizes strong matches)
            # Normalize both vectors for fair comparison
            norm_chroma = np.array(chroma_vector) / (np.max(chroma_vector) + 1e-8)
            norm_template = np.array(template)
            dot_product = np.dot(norm_chroma, norm_template)

            # Method 3: Template presence score (how many template notes are present)
            template_notes = np.array(template) > 0
            chroma_notes = np.array(chroma_vector) > 0.1  # Lower threshold for "present"
            presence_score = np.sum(template_notes & chroma_notes) / np.sum(template_notes)

            # Combined score (weighted average with complexity bonus)
            base_score = (0.4 * correlation + 0.4 * dot_product + 0.2 * presence_score)

            # Bonus for more complex chords (more notes in template)
            complexity_bonus = np.sum(template) * 0.01  # Small bonus for each note

            combined_score = base_score + complexity_bonus

            if combined_score > best_score:
                best_score = combined_score
                best_chord = chord_name

        # Return only if above threshold
        if best_score >= threshold:
            return (best_chord, best_score)
        else:
            return ("Unknown", best_score)
