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
def create_pdf(**args):
    print(f"from server, args is {args}")
    pdf = PDFRenderer(filename=f"shipment_{args['sid']}_report.pdf").render_form("ReportPDF", args)
    return pdf

@anvil.server.callable
def send_pdf_email(**args):
  pdf = create_pdf(args)
  anvil.email.send(
    from_address='no-reply',
    from_name='Events', 
    to=args['email'], 
    subject='Tesla Scan Complete',
    text='Attached information for Tesla Scan',
    attachments=pdf
  )
  return pdf