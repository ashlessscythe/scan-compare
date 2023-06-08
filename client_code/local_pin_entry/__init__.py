from ._anvil_designer import local_pin_entryTemplate
from anvil import *

class local_pin_entry(local_pin_entryTemplate):
  def __init__(self, **properties):
    size = properties.get('size', 60)
    self.length = properties.get('length', 4)
    bg_color = properties.get('bg_color', 'rgba(0,0,200,0.1)')
    fg_color = properties.get('fg_color', 'purple')
    self.init_boxes(bg_color, fg_color, size)
    self.init_components(**properties)
    
  def init_boxes(self, bg_color, fg_color, size):
    for _ in range(self.length):
      box = TextBox(type='tel',
                    bold=True,
                    font_size=32,
                    align='center',
                    background=bg_color,
                    foreground=fg_color,
                    border=f"0px;border-radius:8px;width:{size}px;height:{size}px;")
      self.flow_panel_1.add_component(box)
      box.set_event_handler('change', self.box_on_change)
    
    self.pin = ''
    

  @property
  def pin(self):
    return self._pin
  
  @pin.setter
  def pin(self, value):
    value = ''.join([d for d in f"{value[:self.length]}" if d in '0123456789'])
    if len(value) == self.length:
      self.raise_event('pin_set', pin=value)
      self.reset()
    else:
      self._pin = value
      self.flow_panel_1.get_components()[len(value)].focus()

  
  def reset(self):
    print("reset")
    for box in self.flow_panel_1.get_components():
      box.text = ''
    self.pin = ''
    
    
  def box_on_change(self, **event_args):
    sender = event_args['sender']
    if sender.text:
      d = f"{sender.text}"[-1:]
      if d in '0123456789':
        sender.text = '•'
        self.pin += f"{d}"
      else:
        sender.text = ''

  def form_show(self, **event_args):
    """This method is called when the column panel is shown on the screen"""
    pass

    

