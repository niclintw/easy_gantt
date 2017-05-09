module EasyGantt

  def self.non_working_week_days(user=nil)
    user ||= User.current

    working_days = user.try(:current_working_time_calendar).try(:working_week_days)
    working_days = Array(working_days).map(&:to_i)

    if working_days.any?
      (1..7).to_a - working_days
    else
      Array(Setting.non_working_week_days).map(&:to_i)
    end
  end

  def self.easy_extensions?
    Redmine::Plugin.installed?(:easy_extensions)
  end

  def self.easy_calendar?
    Redmine::Plugin.installed?(:easy_calendar)
  end

  def self.easy_attendances?
    easy_extensions? && Redmine::Plugin.installed?(:easy_attendances) && EasyAttendance.enabled?
  end

  def self.easy_money?
    Redmine::Plugin.installed?(:easy_money)
  end

end
