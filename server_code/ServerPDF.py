import anvil.email
import anvil.google.auth, anvil.google.drive, anvil.google.mail
from anvil.google.drive import app_files
import anvil.users
import anvil.files
from anvil.files import data_files
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables
import anvil.server
from anvil.pdf import PDFRenderer

@anvil.server.callable
def create_pdf(name, date):
    pdf = PDFRenderer(filename=f'{name} Ticket.pdf').render_form('Ticket', name, date)
    return pdf

@anvil.server.callable
def send_pdf_email(email, name, date):
  pdf = create_pdf(name, date)
  anvil.email.send(
    from_address='no-reply',
    from_name='Events', 
    to=email, 
    subject='Your Ticket',
    text='Thanks for registering!. Your ticket is attached to this email.',
    attachments=pdf
  )
  return pdf