import CameraStreakData from 'types/cameraStreakData'

type CameraStreakAndTotalData = CameraStreakData & { total: number }

type CameraData = {
  busLaneCameraViolations: CameraStreakAndTotalData
  cameraViolations: CameraStreakAndTotalData
  cameraViolationsWithBusLaneCameraViolations: CameraStreakAndTotalData
  redLightCameraViolations: CameraStreakAndTotalData
  schoolZoneSpeedCameraViolations: CameraStreakAndTotalData
}

export default CameraData
