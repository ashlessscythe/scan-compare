from ._anvil_designer import ScanCheckTemplate as sc
from anvil import *
import anvil.google.auth, anvil.google.drive
from anvil.google.drive import app_files
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
import anvil.server
import re
from .. import test
from ..import func
from .. import globals
from ..StartNewScanPopup import StartNewScanPopup
from ..NewLabelsScanPopup import NewLabelsScanPopup
from ..pin_popup import pin_popup
from ValidatedTextBox import whiteboard_all
from ValidatedTextBox import TextValueBox

class ScanCheck(sc):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)
    # Any code you write here will run before the form opens.
    # globals?
    self.button_email.visible = True
    self.button_download.visible = True
    
    if not test.TESTING_MODE:
      self.logged_in_user.text = anvil.server.call('get_user')
      # self.link_1.url = anvil.server.call('get_link')
      # removed refresh prior to startup_with_can
      # self.refresh()
      # ask if new scan on startup (dismissable)
      self.startup_with_scan()
      self.refresh()
    else:
      print("testing mode....")
      self.startup_with_scan()
      self.button_next_click()
      
  # new scan?
  def startup_with_scan(self):
    r = self.new_scan()
    print(f"value from new_scan is {r}")
    if r == 'start':
      # add new sid to sid db with pallets
      anvil.server.call('add_shipment', globals.shipment, globals.pallets)
      # TODO check if blanks (maybe in popup, before here)
      globals.reset_globals(self)
      self.text_box_original.focus()
      self.label_shipment.text = globals.shipment
      self.label_shipment.role = 'green-shadow-label'
      self.label_pallets.text = globals.pallets
      self.label_pallets.role = 'green-shadow-label'
      self.label_msg.text = ''
    elif r == 'continue':
      # continue started shipment
      globals.reset_globals(self)
      self.text_box_original.focus()
      self.label_shipment.text = globals.shipment
      self.label_shipment.role = 'green-shadow-label'
      
      r = anvil.server.call('get_shipment_row', globals.shipment)
      self.label_pallets.text = r['total_pallets']
      globals.current_pallet = r['scanned_pallets']
      
      self.label_pallets.role = 'green-shadow-label'
      self.label_msg.text = ''
    else:
      # globals not changed by this
      # TODO - figure this out
      self.label_shipment.text = "NO ACTIVE SHIPMENT"
      self.label_shipment.role = 'warning-label'
      self.label_pallets.text = "NOT VALID SCAN, TESTING USE ONLY"
      self.label_pallets.role = 'warning-label'
      self.label_msg.text = 'Please reset to start new scan.'
      self.label_msg.role = 'warning-label'
      
  def new_scan(self):
  # if testing allow dismiss
    if test.TESTING_MODE:
      res = alert(
        content=StartNewScanPopup(),
        title="Start New Scan?",
        large=True,
        buttons=[
          ("OK", True)
        ]
      )
    else:
      res = alert(
        content=StartNewScanPopup(),
        title="Start New Scan?",
        large=True,
        buttons=None,
        dismissible=False
      )
    return res
    
  # refresh
  def refresh(self, **event_args):
    self.repeating_panel_1.items = anvil.server.call('get_shipment_rows', globals.shipment)
  
  def clear_scan_page(self):
    self.clear_text_boxes()
    self.text_box_original.focus()
    anvil.server.call('reset_session_db')
    self.refresh()
    
  def button_logout_click(self, **event_args):
    self.clear_scan_page()
    func.logout(self)
  
  def clear_text_boxes(self):
    self.text_box_original.text = ""
    self.text_box_new.text = ""
    self.text_box_original.focus()
    
  def startup_focus(self, **event_args):
    """This method is called when the Label is shown on the screen"""
    self.text_box_original.focus()

  def button_reset_click(self, **event_args):
    """This method is called when the button is clicked"""
    c = confirm("Clear page?")
    if c:
      self.clear_scan_page()
      globals.reset_globals(self)
      self.startup_with_scan()

  def check_valid(self, obj):
    r = func.is_valid(obj.text)
    # alert(r)
    return r
    
  
  def text_box_lost_focus(self, **event_args):
    """This method is called when the TextBox loses focus"""
    obj = event_args['sender']
    if len(obj.text) == 0:
      pass
    else:
      if self.check_valid(obj):
        obj.role = 'default'
        if test.TESTING_MODE:
          # no db check if testing
          with Notification(message="TESTING MODE, NO DB CHECK"):
            exists = False
            print(f'TESTING: lic plate {func.extract_lic(self, obj.text)}')
            print(f'TESTING: pn is {func.extract_pn(self, obj.text)}')
        else:
          with Notification(message="Checking against DB..."):
            # TODO try async
            exists = anvil.server.call('is_in_db', obj.text) 
            print(f'lic plate {func.extract_lic(self, obj.text)}')
            print(f'pn is {func.extract_pn(self, obj.text)}')
        if exists:
          # already in db
          alert(
            content='Scan already in database',
            title='Barcode in Database',
            large=True,
            dismissible=True
          )
          obj.text = ''
          obj.focus()
      else:
        Notification('Invalid Barcode...')
        obj.role = 'outlined-error'

  def get_scans(self):
    return (
        self.text_box_original.text.strip(),
        self.text_box_new.text.strip()
      )
    
  def check_if_valid(self, scans):
    # 2 scans
    print(scans)
    b_missing = True in set([len(s) == 0 for s in scans])
    print(f'b_missing is {b_missing}')
    if b_missing:
      func.display_message(
        self,
        title='Missing Scan',
        message='Please scan 2 barcodes',
        role='warning-popup',
        bool_large = True
      )
      self.text_box_original.focus()
    else:
      # 2 different scans
      if len(set(scans)) == 1:
        func.display_message(
          self,
          title='Error',
          message = 'Same barcode scanned twice',
          role='warning-popup',
          bool_large=True
        )
        self.text_box_original.focus()
      else:
        # 2 valid scans
        if not func.is_valid(scans[0]) or not func.is_valid(scans[1]):
          func.display_message(
            self,
            title='Error',
            message='Invalid Barcode',
            role='warning-popup',
            bool_large=True
          )
          self.text_box_original.focus()
        else:
          # Extract pn
          pn1 = func.extract_pn(self, scans[0])
          pn2 = func.extract_pn(self, scans[1])
          # alert if both pn match
          if not pn1 == pn2:
            # if invalid, show err, focus textbox
            func.display_message(self, 'Invalid Scan', 'Part numbers do not match', 'warning', True)
            self.text_box_original.focus()
          else:
            Notification('Part numbers match.', timeout=2)
            return True
            
  def button_next_click(self, **event_args):
    """This method is called when the button is clicked"""
    #check if valid
    if test.TESTING_MODE:
      scans = (
        test.qr_s
      )
      print(f"test scans {scans}")
      scan_ok = self.check_if_valid(scans)
    else:
      scans = self.get_scans()
      print(f"non-test scans {scans}")
      scan_ok = self.check_if_valid(scans)
    # ref
    if scan_ok:
      globals.current_pallet += 1
      print(f"globals current_pallet increased to {globals.current_pallet}")
      kwargs = {
        'qr_s':scans,
        'pn_s':[func.extract_pn(self, pn) for pn in self.get_scans()],
        'pn':func.extract_pn(self, scans[0]),
        'shipment':globals.shipment,
        'pallets':globals.pallets,
        'current_pallet':globals.current_pallet
      }
      print(f"kwargs is {kwargs}")
      # will return either {'result': 'err', 'value': index} or result ok
      result = alert(
        content=NewLabelsScanPopup(**kwargs),
        title='Scan New Labels',
        buttons={('Done', 'done')},
        large=True
        )
      # display msg
      func.display_message(
        self,
        title='Result: ' + result['res'],
        message=result['result'],
        role='warning-popup' if result['res'] == 'ERR' else 'default',
        bool_large=True
      ) 
      print(f"result of newlabelscanpopup is {result}")      
      # ok if scans passed, and added to db and session
      if result['res'] == 'OK':
        # user did not click 'ok' on above alert
        # clear textboxes and focus textbox 1 after popup close
        self.clear_text_boxes()
        self.refresh()
        
        # check if done (complete)
        r = anvil.server.call('get_shipment_row', globals.shipment)
        if r['scanned_pallets'] >= r['total_pallets']:
          func.display_message(
            self,
            title='Done Scanning',
            message='Scanning complete, file can be downloaded',
            role='green-shadow-label',
            bool_large=True
          )
          self.button_download.visible = True
          self.button_email.visible = True
        self.clear_text_boxes()
        self.refresh()
      elif result == 'ERR':
        # pin popup
        pin_response = alert(
          content = pin_popup(),
          title='ERROR DUPLICATE SCAN: Need ADMIN PIN:',
          large=True,
          dismissible=False,
          buttons=''
        )
        print(f"pin response is {pin_response}")
        # original msg
        # func.display_message(
        #   self,
        #   title='Error Duplicate',
        #   message='Barcodes already scanned in this session.',
        #   role='warning-popup',
        #   bool_large=True
        #   )
        self.clear_text_boxes()
        self.refresh()
        
  def text_box_original_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.text_box_new.focus()

  def text_box_new_pressed_enter(self, **event_args):
    """This method is called when the user presses Enter in this text box"""
    self.button_next_click()

  def text_box_select_on_focus(self, **event_args):
    """This method is called when the TextBox gets focus"""
    event_args['sender'].select()
  
  def button_download_click(self, **event_args):
    """This method is called when the button is clicked"""
    # result = anvil.server.call("export_to_excel", globals.shipment)
    # anvil.media.download(result)
    args = {'sid':globals.shipment, 'pallets':globals.pallets}
    print(f"button pressed: args is {args}")
    pdf = anvil.server.call('create_pdf', **args)
    print(f"pdf returned... attempting download")
    anvil.media.download(pdf)

  def button_email_click(self, **event_args):
    """This method is called when the button is clicked"""
    with Notification("Sending email..."):
      # anvil.server.call('send_email', globals.shipment)
      args = {'sid':globals.shipment, 'pallets':globals.pallets}
      anvil.server.call('send_pdf_email', **args)

  def outlined_button_2_click(self, **event_args):
    """This method is called when the button is clicked"""
    self.refresh()



