"""Public interfaces for campus modules; implementation lives in feature files."""
from .campus_common import rows, one, integer, event
from .registration import RegistrationService
from .academic_records import AcademicRecordsService
from .attendance import AttendanceService
from .finance import FinanceService
from .student_services import StudentServices
from .advising import AdvisingService
from .workspace import WorkspaceService
from .governance import GovernanceService
